import { NextRequest, NextResponse } from "next/server"
import { query } from "@refugehouse/shared-core/db"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

// POST - Send individual schedule reports to each assignee
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { onCallType, schedules } = body

    console.log("📧 Generating individual reports for:", onCallType, "- Assignees:", schedules?.length)

    // Group schedules by user
    const userSchedules = new Map<string, any[]>()
    
    schedules.forEach((schedule: any) => {
      const userId = schedule.user_id
      if (!userSchedules.has(userId)) {
        userSchedules.set(userId, [])
      }
      userSchedules.get(userId)!.push(schedule)
    })

    console.log("📧 Grouped into", userSchedules.size, "unique assignees")

    // Get user details for each assignee
    const userIds = Array.from(userSchedules.keys())
    const users = await query(`
      SELECT 
        id,
        email,
        first_name,
        last_name,
        phone
      FROM app_users
      WHERE id IN (${userIds.map((_, i) => `@param${i}`).join(', ')})
        AND is_active = 1
        AND email IS NOT NULL
    `, userIds)

    if (users.length === 0) {
      console.log("⚠️ No valid users found for individual reports")
      return NextResponse.json({
        success: false,
        message: "No active users with email addresses found",
      }, { status: 400 })
    }

    // Generate individual reports
    const reports = users.map((user: any) => {
      const assigneeSchedules = userSchedules.get(user.id) || []
      const formattedSchedules = assigneeSchedules.map((schedule: any) => {
        const start = new Date(schedule.start_datetime)
        const end = new Date(schedule.end_datetime)
        return {
          start: start.toLocaleString('en-US', { 
            weekday: 'short',
            month: 'short', 
            day: 'numeric', 
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true 
          }),
          end: end.toLocaleString('en-US', { 
            weekday: 'short',
            month: 'short', 
            day: 'numeric', 
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true 
          }),
          hours: ((end.getTime() - start.getTime()) / (1000 * 60 * 60)).toFixed(1),
          notes: schedule.notes || '',
        }
      })

      return {
        recipient: {
          email: user.email,
          name: `${user.first_name} ${user.last_name}`,
          phone: user.phone,
        },
        schedules: formattedSchedules,
        totalShifts: formattedSchedules.length,
        totalHours: formattedSchedules.reduce((sum, s) => sum + parseFloat(s.hours), 0).toFixed(1),
      }
    })

    // TODO: Integrate with your email service (SendGrid, AWS SES, etc.)
    // For now, we'll log the reports and return success
    
    console.log("📧 Individual Reports Generated:")
    reports.forEach((report, index) => {
      console.log(`\nReport ${index + 1}:`)
      console.log(`  To: ${report.recipient.name} <${report.recipient.email}>`)
      console.log(`  Shifts: ${report.totalShifts}`)
      console.log(`  Total Hours: ${report.totalHours}`)
      console.log(`  Schedules:`, JSON.stringify(report.schedules, null, 2))
    })

    // Simulate email sending
    // In production, replace this with actual email service calls:
    /*
    for (const report of reports) {
      await sendEmail({
        to: report.recipient.email,
        subject: `Your On-Call Schedule: ${onCallType}`,
        html: generateIndividualReportHTML(report.recipient.name, onCallType, report.schedules, report.totalHours),
      })
    }
    */

    return NextResponse.json({
      success: true,
      message: "Individual reports generated successfully",
      count: reports.length,
      // In development, return the data so you can see what would be emailed
      reports: reports,
    })
  } catch (error) {
    console.error("❌ Error generating individual reports:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to generate individual reports",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

