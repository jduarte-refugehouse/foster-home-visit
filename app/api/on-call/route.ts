import { NextRequest, NextResponse } from "next/server"
import { currentUser } from "@clerk/nextjs/server"
import { query } from "@/lib/db"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

// GET - Fetch on-call schedules
export async function GET(request: NextRequest) {
  try {
    console.log("📅 [API] Fetching on-call schedules")

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")
    const userId = searchParams.get("userId")
    const includeDeleted = searchParams.get("includeDeleted") === "true"
    
    console.log("📅 [API] Query parameters:", { startDate, endDate, userId, includeDeleted })

    let whereConditions = ["ocs.is_active = 1"]
    const params: any[] = []

    if (!includeDeleted) {
      whereConditions.push("ocs.is_deleted = 0")
    }

    if (startDate) {
      params.push(startDate)
      whereConditions.push(`ocs.end_datetime >= @param${params.length - 1}`)
    }

    if (endDate) {
      params.push(endDate)
      whereConditions.push(`ocs.start_datetime <= @param${params.length - 1}`)
    }

    if (userId) {
      params.push(userId)
      whereConditions.push(`ocs.user_id = @param${params.length - 1}`)
    }

    const whereClause = whereConditions.join(" AND ")

    const schedules = await query(
      `
      SELECT 
        ocs.id,
        ocs.user_id,
        ocs.user_name,
        ocs.user_email,
        ocs.user_phone,
        ocs.start_datetime,
        ocs.end_datetime,
        ocs.duration_hours,
        ocs.on_call_type,
        ocs.on_call_category,
        ocs.role_required,
        ocs.department,
        ocs.region,
        ocs.escalation_level,
        ocs.is_active,
        ocs.notes,
        ocs.priority_level,
        ocs.created_by_name,
        ocs.created_at,
        ocs.updated_at,
        ocs.updated_by_name,
        -- Calculate if currently on call
        CASE 
          WHEN GETDATE() BETWEEN ocs.start_datetime AND ocs.end_datetime 
          THEN 1 
          ELSE 0 
        END as is_currently_active,
        -- User details from app_users if linked
        u.first_name,
        u.last_name,
        u.email as user_app_email
      FROM on_call_schedule ocs
      LEFT JOIN app_users u ON ocs.user_id = u.id
      WHERE ${whereClause}
      ORDER BY ocs.start_datetime ASC
    `,
      params,
    )

    console.log(`✅ [API] Retrieved ${schedules.length} on-call schedules`)

    return NextResponse.json({
      success: true,
      schedules,
      count: schedules.length,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("❌ [API] Error fetching on-call schedules:", error)
    console.error("❌ [API] Error details:", {
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined,
    })
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch on-call schedules",
        details: error instanceof Error ? error.message : "Unknown error",
        errorType: error instanceof Error ? error.name : "Unknown",
        stack: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : undefined) : undefined,
      },
      { status: 500 },
    )
  }
}

// POST - Create new on-call schedule assignment
export async function POST(request: NextRequest) {
  try {
    console.log("📅 [API] Creating new on-call schedule")

    const user = await currentUser()
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    console.log("📅 [API] Request body:", JSON.stringify(body, null, 2))
    
    const { 
      userId, 
      userName, 
      userEmail, 
      userPhone, 
      startDatetime, 
      endDatetime, 
      notes, 
      priorityLevel,
      onCallType,
      onCallCategory,
      roleRequired,
      department,
      region,
      escalationLevel
    } = body
    
    console.log("📅 [API] Extracted values:", {
      userId,
      userName,
      startDatetime,
      endDatetime,
      onCallType,
      roleRequired,
      department,
      escalationLevel
    })

    // Validation
    if (!userName || !startDatetime || !endDatetime) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: userName, startDatetime, endDatetime",
        },
        { status: 400 },
      )
    }

    // Validate date range
    const start = new Date(startDatetime)
    const end = new Date(endDatetime)
    if (end <= start) {
      return NextResponse.json(
        {
          success: false,
          error: "End datetime must be after start datetime",
        },
        { status: 400 },
      )
    }

    // Check for overlapping assignments for the same user
    if (userId) {
      const overlaps = await query(
        `
        SELECT COUNT(*) as overlap_count
        FROM on_call_schedule
        WHERE user_id = @param0
          AND is_active = 1
          AND is_deleted = 0
          AND (
            (start_datetime <= @param1 AND end_datetime >= @param1)
            OR (start_datetime <= @param2 AND end_datetime >= @param2)
            OR (start_datetime >= @param1 AND end_datetime <= @param2)
          )
      `,
        [userId, startDatetime, endDatetime],
      )

      if (overlaps[0].overlap_count > 0) {
        return NextResponse.json(
          {
            success: false,
            error: "This user already has an overlapping on-call assignment",
            code: "OVERLAP_CONFLICT",
          },
          { status: 409 },
        )
      }
    }

    // Create the on-call schedule
    const result = await query(
      `
      INSERT INTO on_call_schedule (
        id,
        user_id,
        user_name,
        user_email,
        user_phone,
        start_datetime,
        end_datetime,
        notes,
        priority_level,
        on_call_type,
        on_call_category,
        role_required,
        department,
        region,
        escalation_level,
        is_active,
        created_by_user_id,
        created_by_name,
        created_at
      )
      OUTPUT INSERTED.id
      VALUES (
        NEWID(),
        @param0,
        @param1,
        @param2,
        @param3,
        @param4,
        @param5,
        @param6,
        @param7,
        @param8,
        @param9,
        @param10,
        @param11,
        @param12,
        @param13,
        1,
        @param14,
        @param15,
        GETDATE()
      )
    `,
      [
        userId || null,
        userName,
        userEmail || null,
        userPhone || null,
        startDatetime,
        endDatetime,
        notes || null,
        priorityLevel || "normal",
        onCallType || "general",
        onCallCategory || null,
        roleRequired || null,
        department || null,
        region || null,
        escalationLevel || 1,
        user.id,
        `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.emailAddresses[0]?.emailAddress || "Unknown",
      ],
    )

    const newScheduleId = result[0].id

    console.log(`✅ [API] Created on-call schedule: ${newScheduleId}`)

    return NextResponse.json({
      success: true,
      scheduleId: newScheduleId,
      message: "On-call schedule created successfully",
    })
  } catch (error) {
    console.error("❌ [API] Error creating on-call schedule:", error)
    console.error("❌ [API] Error details:", {
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined,
    })
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create on-call schedule",
        details: error instanceof Error ? error.message : "Unknown error",
        errorType: error instanceof Error ? error.name : "Unknown",
        stack: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : undefined) : undefined,
      },
      { status: 500 },
    )
  }
}

