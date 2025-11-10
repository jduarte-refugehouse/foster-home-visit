import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

// GET - Check 24/7 on-call coverage and identify gaps
export async function GET(request: NextRequest) {
  try {
    console.log("📅 [API] Checking on-call coverage")

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get("startDate") || new Date().toISOString()
    const endDate = searchParams.get("endDate") || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days ahead
    const onCallType = searchParams.get("type")

    console.log(`Checking coverage from ${startDate} to ${endDate}`, onCallType ? `for type: ${onCallType}` : '(all types)')

    // Build query with optional type filter
    let whereConditions = [
      "is_active = 1",
      "is_deleted = 0",
      "end_datetime >= @param0",
      "start_datetime <= @param1"
    ]
    const params: any[] = [startDate, endDate]

    if (onCallType) {
      params.push(onCallType)
      whereConditions.push(`on_call_type = @param${params.length - 1}`)
    }

    const whereClause = whereConditions.join(" AND ")

    // Get all active shifts in the date range
    const shifts = await query(
      `
      SELECT 
        id,
        user_name,
        start_datetime,
        end_datetime,
        priority_level
      FROM on_call_schedule
      WHERE ${whereClause}
      ORDER BY start_datetime ASC
    `,
      params,
    )

    console.log(`Found ${shifts.length} shifts in range`)

    // Find coverage gaps
    const gaps: any[] = []
    const overlaps: any[] = []
    const rangeStart = new Date(startDate)
    const rangeEnd = new Date(endDate)

    // Check if there's coverage from the start of the range
    if (shifts.length === 0) {
      gaps.push({
        gap_start: rangeStart.toISOString(),
        gap_end: rangeEnd.toISOString(),
        gap_hours: (rangeEnd.getTime() - rangeStart.getTime()) / (1000 * 60 * 60),
        severity: "critical",
        message: "No on-call coverage scheduled",
      })
    } else {
      const firstShift = new Date(shifts[0].start_datetime)
      if (firstShift > rangeStart) {
        const gapHours = (firstShift.getTime() - rangeStart.getTime()) / (1000 * 60 * 60)
        gaps.push({
          gap_start: rangeStart.toISOString(),
          gap_end: firstShift.toISOString(),
          gap_hours: gapHours,
          severity: gapHours > 24 ? "critical" : gapHours > 4 ? "high" : "medium",
          message: "Coverage gap at start of period",
        })
      }

      // Check gaps between shifts
      for (let i = 0; i < shifts.length - 1; i++) {
        const currentEnd = new Date(shifts[i].end_datetime)
        const nextStart = new Date(shifts[i + 1].start_datetime)

        if (nextStart > currentEnd) {
          const gapHours = (nextStart.getTime() - currentEnd.getTime()) / (1000 * 60 * 60)
          if (gapHours > 0.1) {
            // Ignore tiny gaps (< 6 minutes)
            gaps.push({
              gap_start: currentEnd.toISOString(),
              gap_end: nextStart.toISOString(),
              gap_hours: gapHours,
              severity: gapHours > 24 ? "critical" : gapHours > 4 ? "high" : "medium",
              message: `Coverage gap between ${shifts[i].user_name} and ${shifts[i + 1].user_name}`,
              previous_user: shifts[i].user_name,
              next_user: shifts[i + 1].user_name,
            })
          }
        } else if (nextStart < currentEnd) {
          // Overlap detected
          const overlapHours = (currentEnd.getTime() - nextStart.getTime()) / (1000 * 60 * 60)
          overlaps.push({
            overlap_start: nextStart.toISOString(),
            overlap_end: currentEnd.toISOString(),
            overlap_hours: overlapHours,
            users: [shifts[i].user_name, shifts[i + 1].user_name],
            message: `${shifts[i].user_name} and ${shifts[i + 1].user_name} have overlapping shifts`,
          })
        }
      }

      // Check if there's coverage to the end of the range
      const lastShift = new Date(shifts[shifts.length - 1].end_datetime)
      if (lastShift < rangeEnd) {
        const gapHours = (rangeEnd.getTime() - lastShift.getTime()) / (1000 * 60 * 60)
        gaps.push({
          gap_start: lastShift.toISOString(),
          gap_end: rangeEnd.toISOString(),
          gap_hours: gapHours,
          severity: gapHours > 24 ? "critical" : gapHours > 4 ? "high" : "medium",
          message: "Coverage gap at end of period",
        })
      }
    }

    // Calculate coverage statistics
    const totalHours = (rangeEnd.getTime() - rangeStart.getTime()) / (1000 * 60 * 60)
    const gapHours = gaps.reduce((sum, gap) => sum + gap.gap_hours, 0)
    const coveragePercentage = ((totalHours - gapHours) / totalHours) * 100

    // Determine overall status
    let overallStatus = "full"
    if (gaps.length > 0) {
      const hasCriticalGaps = gaps.some((g) => g.severity === "critical")
      overallStatus = hasCriticalGaps ? "critical" : "partial"
    }

    // Get current on-call person
    const currentOnCall = await query(`
      SELECT 
        user_name,
        user_email,
        user_phone,
        start_datetime,
        end_datetime
      FROM on_call_schedule
      WHERE is_active = 1
        AND is_deleted = 0
        AND GETDATE() BETWEEN start_datetime AND end_datetime
      ORDER BY priority_level DESC
    `)

    console.log(`✅ [API] Coverage analysis complete: ${gaps.length} gaps found, ${coveragePercentage.toFixed(1)}% coverage`)

    return NextResponse.json({
      success: true,
      coverage: {
        status: overallStatus,
        covered_percentage: Math.round(coveragePercentage * 10) / 10, // Use snake_case for consistency
        coveragePercentage: Math.round(coveragePercentage * 10) / 10, // Keep camelCase for backwards compatibility
        totalHours,
        coveredHours: totalHours - gapHours,
        gapHours,
        startDate,
        endDate,
        gaps, // Include gaps in coverage object
        overlaps, // Include overlaps in coverage object
      },
      currentOnCall: currentOnCall.length > 0 ? currentOnCall[0] : null,
      shifts: shifts.map((s) => ({
        id: s.id,
        user_name: s.user_name,
        start_datetime: s.start_datetime,
        end_datetime: s.end_datetime,
        priority_level: s.priority_level,
      })),
      gaps, // Also keep at top level for backwards compatibility
      overlaps,
      warnings: [
        ...gaps.map((g) => ({
          type: "gap",
          severity: g.severity,
          message: g.message,
          start: g.gap_start,
          end: g.gap_end,
          hours: g.gap_hours,
        })),
        ...overlaps.map((o) => ({
          type: "overlap",
          severity: "warning",
          message: o.message,
          start: o.overlap_start,
          end: o.overlap_end,
          hours: o.overlap_hours,
        })),
      ],
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("❌ [API] Error checking coverage:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to check on-call coverage",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

