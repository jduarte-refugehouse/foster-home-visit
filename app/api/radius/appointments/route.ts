import { NextRequest, NextResponse } from "next/server"
import { validateApiKey } from "@/lib/api-auth"
import { query } from "@refugehouse/shared-core/db"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

/**
 * GET /api/radius/appointments
 * 
 * Proxy endpoint for accessing appointment data from RadiusBifrost
 * Requires API key authentication via x-api-key header
 * 
 * Query Parameters:
 * - startDate: Filter appointments from this date (ISO string)
 * - endDate: Filter appointments until this date (ISO string)
 * - assignedTo: Filter by assigned user ID (optional)
 * - status: Filter by status (optional)
 * - type: Filter by appointment type (optional)
 * 
 * Returns: { success: boolean, count: number, appointments: Appointment[], timestamp: string }
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now()

  try {
    // 1. Validate API key
    const apiKeyRaw = request.headers.get("x-api-key")
    const apiKey = apiKeyRaw?.trim() || null // Trim whitespace from header value
    const validation = await validateApiKey(apiKey)

    if (!validation.valid) {
      console.warn(`🚫 [RADIUS-API] Invalid API key attempt: ${validation.error}`)
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
          details: validation.error || "Invalid API key",
        },
        { status: 401 }
      )
    }

    console.log(
      `✅ [RADIUS-API] Authenticated request from microservice: ${validation.key?.microservice_code}`
    )

    // 2. Parse query parameters
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")
    const assignedTo = searchParams.get("assignedTo")
    const status = searchParams.get("status")
    const appointmentType = searchParams.get("type")

    // 3. Build dynamic query
    const whereConditions = ["a.is_deleted = 0"]
    const params: any[] = []
    let paramIndex = 0

    if (startDate) {
      whereConditions.push(`a.start_datetime >= @param${paramIndex}`)
      params.push(new Date(startDate))
      paramIndex++
    }

    if (endDate) {
      whereConditions.push(`a.end_datetime <= @param${paramIndex}`)
      params.push(new Date(endDate))
      paramIndex++
    }

    if (assignedTo) {
      whereConditions.push(`a.assigned_to_user_id = @param${paramIndex}`)
      params.push(assignedTo)
      paramIndex++
    }

    if (status) {
      whereConditions.push(`a.status = @param${paramIndex}`)
      params.push(status)
      paramIndex++
    }

    if (appointmentType) {
      whereConditions.push(`a.appointment_type = @param${paramIndex}`)
      params.push(appointmentType)
      paramIndex++
    }

    const whereClause =
      whereConditions.length > 0 ? `WHERE ${whereConditions.join(" AND ")}` : ""

    // 4. Query RadiusBifrost directly
    console.log(`📅 [RADIUS-API] Fetching appointments with filters:`, {
      startDate,
      endDate,
      assignedTo,
      status,
      appointmentType,
    })

    const appointments = await query(
      `
      SELECT 
        a.appointment_id,
        a.title,
        a.description,
        a.appointment_type,
        a.start_datetime,
        a.end_datetime,
        a.duration_minutes,
        a.status,
        a.home_xref,
        a.location_address,
        a.location_notes,
        a.assigned_to_user_id,
        a.assigned_to_name,
        a.assigned_to_role,
        a.created_by_user_id,
        a.created_by_name,
        a.priority,
        a.is_recurring,
        a.recurring_pattern,
        a.parent_appointment_id,
        a.preparation_notes,
        a.completion_notes,
        a.outcome,
        a.created_at,
        a.updated_at,
        h.HomeName as home_name,
        h.Street,
        h.City,
        h.State,
        h.Zip,
        h.Unit,
        h.CaseManager,
        h.HomePhone
      FROM appointments a
      LEFT JOIN SyncActiveHomes h ON a.home_xref = h.Xref
      ${whereClause}
      ORDER BY a.start_datetime DESC
    `,
      params
    )

    const duration = Date.now() - startTime

    console.log(
      `✅ [RADIUS-API] Successfully retrieved ${appointments.length} appointments in ${duration}ms`
    )

    // 5. Return response
    return NextResponse.json({
      success: true,
      count: appointments.length,
      appointments,
      timestamp: new Date().toISOString(),
      duration_ms: duration,
    })
  } catch (error) {
    const duration = Date.now() - startTime
    console.error("❌ [RADIUS-API] Error in appointments endpoint:", error)

    return NextResponse.json(
      {
        success: false,
        count: 0,
        appointments: [],
        error: error instanceof Error ? error.message : "Unknown error occurred",
        timestamp: new Date().toISOString(),
        duration_ms: duration,
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/radius/appointments
 * 
 * Create a new appointment in RadiusBifrost
 * Requires API key authentication via x-api-key header
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    // 1. Validate API key
    const apiKeyRaw = request.headers.get("x-api-key")
    const apiKey = apiKeyRaw?.trim() || null
    const validation = await validateApiKey(apiKey)

    if (!validation.valid) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
          details: validation.error || "Invalid API key",
        },
        { status: 401 }
      )
    }

    // 2. Parse request body
    const body = await request.json()
    const {
      title,
      description,
      appointmentType = "home_visit",
      startDateTime,
      endDateTime,
      homeXref,
      locationAddress,
      locationNotes,
      assignedToUserId,
      assignedToName,
      assignedToRole,
      priority = "normal",
      isRecurring = false,
      recurringPattern,
      preparationNotes,
      createdByName,
    } = body

    // 3. Validation
    if (!title || !startDateTime || !endDateTime) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: title, startDateTime, endDateTime",
        },
        { status: 400 }
      )
    }

    // If assigned, both userId and name should be provided
    if ((assignedToUserId && !assignedToName) || (!assignedToUserId && assignedToName)) {
      return NextResponse.json(
        {
          success: false,
          error: "If assigning to a user, both assignedToUserId and assignedToName are required",
        },
        { status: 400 }
      )
    }

    if (homeXref) {
      const homeExists = await query("SELECT COUNT(*) as count FROM SyncActiveHomes WHERE Xref = @param0", [homeXref])
      if (homeExists[0].count === 0) {
        return NextResponse.json(
          { success: false, error: "Selected home does not exist" },
          { status: 400 }
        )
      }
    }

    // 4. Parse datetime strings
    let startStr: string
    let endStr: string

    if (typeof startDateTime === 'string') {
      if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(startDateTime)) {
        return NextResponse.json(
          { success: false, error: "Invalid startDateTime format. Expected YYYY-MM-DDTHH:mm:ss" },
          { status: 400 }
        )
      }
      startStr = startDateTime
    } else {
      const date = new Date(startDateTime)
      const pad = (n: number) => n.toString().padStart(2, '0')
      startStr = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
    }

    if (typeof endDateTime === 'string') {
      if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(endDateTime)) {
        return NextResponse.json(
          { success: false, error: "Invalid endDateTime format. Expected YYYY-MM-DDTHH:mm:ss" },
          { status: 400 }
        )
      }
      endStr = endDateTime
    } else {
      const date = new Date(endDateTime)
      const pad = (n: number) => n.toString().padStart(2, '0')
      endStr = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
    }

    // 5. Validate that end is after start
    const [startDatePart, startTimePart] = startStr.split('T')
    const [startYear, startMonth, startDay] = startDatePart.split('-').map(Number)
    const [startHour, startMinute] = startTimePart.split(':').map(Number)
    const startDate = new Date(startYear, startMonth - 1, startDay, startHour, startMinute, 0)

    const [endDatePart, endTimePart] = endStr.split('T')
    const [endYear, endMonth, endDay] = endDatePart.split('-').map(Number)
    const [endHour, endMinute] = endTimePart.split(':').map(Number)
    const endDate = new Date(endYear, endMonth - 1, endDay, endHour, endMinute, 0)

    if (startDate >= endDate) {
      return NextResponse.json(
        { success: false, error: "End time must be after start time" },
        { status: 400 }
      )
    }

    // 6. Create appointment
    const result = await query(
      `
      INSERT INTO appointments (
        title,
        description,
        appointment_type,
        start_datetime,
        end_datetime,
        status,
        home_xref,
        location_address,
        location_notes,
        assigned_to_user_id,
        assigned_to_name,
        assigned_to_role,
        created_by_user_id,
        created_by_name,
        priority,
        is_recurring,
        recurring_pattern,
        preparation_notes,
        created_at,
        updated_at
      )
      OUTPUT INSERTED.appointment_id, INSERTED.created_at
      VALUES (
        @param0, @param1, @param2, @param3, @param4, 'scheduled',
        @param5, @param6, @param7, @param8, @param9,
        @param10, @param11, @param12, @param13, @param14, @param15,
        @param16, GETUTCDATE(), GETUTCDATE()
      )
    `,
      [
        title,
        description,
        appointmentType,
        startStr,
        endStr,
        homeXref,
        locationAddress,
        locationNotes,
        assignedToUserId || null,
        assignedToName || null,
        assignedToRole || null,
        "temp-user-id",
        createdByName || "System User",
        priority,
        isRecurring ? 1 : 0,
        recurringPattern || null,
        preparationNotes || null,
      ]
    )

    const appointmentId = result[0].appointment_id
    const duration = Date.now() - startTime
    console.log(`✅ [RADIUS-API] Created appointment ${appointmentId} in ${duration}ms`)

    return NextResponse.json(
      {
        success: true,
        appointmentId,
        message: "Appointment created successfully",
        timestamp: new Date().toISOString(),
        duration_ms: duration,
      },
      { status: 201 }
    )
  } catch (error) {
    const duration = Date.now() - startTime
    console.error("❌ [RADIUS-API] Error in appointments POST:", error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
        timestamp: new Date().toISOString(),
        duration_ms: duration,
      },
      { status: 500 }
    )
  }
}

