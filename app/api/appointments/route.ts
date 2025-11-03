import { NextResponse, type NextRequest } from "next/server"
import { query } from "@/lib/db"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

// GET - Fetch appointments with optional filtering
export async function GET(request: NextRequest) {
  try {
    console.log("🔍 [API] Fetching appointments (no auth middleware)")

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")
    const assignedTo = searchParams.get("assignedTo")
    const status = searchParams.get("status")
    const appointmentType = searchParams.get("type")

    console.log("📅 [API] Fetching appointments with filters:", {
      startDate,
      endDate,
      assignedTo,
      status,
      appointmentType,
    })

    // Build dynamic query based on filters
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

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(" AND ")}` : ""

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
        -- Include complete home details from SyncActiveHomes
        h.HomeName as home_name,
        h.Street,
        h.City,
        h.State,
        h.Zip,
        h.Unit,
        h.CaseManager,
        h.HomePhone,
        h.CaseManagerEmail,
        h.CaseManagerPhone,
        h.Latitude,
        h.Longitude
      FROM appointments a
      LEFT JOIN SyncActiveHomes h ON a.home_xref = h.Xref
      ${whereClause}
      ORDER BY a.start_datetime ASC
    `,
      params,
    )

    console.log(`✅ [API] Retrieved ${appointments.length} appointments`)

    return NextResponse.json({
      success: true,
      count: appointments.length,
      appointments: appointments.map((appointment) => ({
        ...appointment,
        home_info: appointment.home_xref
          ? {
              xref: appointment.home_xref,
              name: appointment.home_name,
              address:
                `${appointment.Street || ""}, ${appointment.City || ""}, ${appointment.State || ""} ${appointment.Zip || ""}`
                  .trim()
                  .replace(/^,\s*/, ""),
              fullAddress: {
                street: appointment.Street,
                city: appointment.City,
                state: appointment.State,
                zip: appointment.Zip,
              },
              unit: appointment.Unit,
              caseManager: appointment.CaseManager,
              phone: appointment.HomePhone,
              caseManagerEmail: appointment.CaseManagerEmail,
              caseManagerPhone: appointment.CaseManagerPhone,
              coordinates:
                appointment.Latitude && appointment.Longitude
                  ? {
                      lat: Number.parseFloat(appointment.Latitude),
                      lng: Number.parseFloat(appointment.Longitude),
                    }
                  : null,
            }
          : null,
        // Ensure consistent date formatting
        start_datetime: new Date(appointment.start_datetime).toISOString(),
        end_datetime: new Date(appointment.end_datetime).toISOString(),
        created_at: new Date(appointment.created_at).toISOString(),
        updated_at: new Date(appointment.updated_at).toISOString(),
      })),
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("❌ [API] Error fetching appointments:", error)
    console.error("❌ [API] Error details:", {
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined,
    })
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch appointments",
        details: error instanceof Error ? error.message : "Unknown error",
        errorType: error instanceof Error ? error.name : "Unknown",
        stack: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : undefined) : undefined,
      },
      { status: 500 },
    )
  }
}

// POST - Create new appointment
export async function POST(request: NextRequest) {
  try {
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

    // Validation
    if (!title || !startDateTime || !endDateTime || !assignedToUserId || !assignedToName) {
      return NextResponse.json(
        { error: "Missing required fields: title, startDateTime, endDateTime, assignedToUserId, assignedToName" },
        { status: 400 },
      )
    }

    if (homeXref) {
      const homeExists = await query("SELECT COUNT(*) as count FROM SyncActiveHomes WHERE Xref = @param0", [homeXref])

      if (homeExists[0].count === 0) {
        return NextResponse.json({ error: "Selected home does not exist" }, { status: 400 })
      }
    }

    // Validate dates
    const start = new Date(startDateTime)
    const end = new Date(endDateTime)
    if (start >= end) {
      return NextResponse.json({ error: "End time must be after start time" }, { status: 400 })
    }

    console.log("📅 [API] Creating new appointment:", { title, appointmentType, assignedToName })

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
        start,
        end,
        homeXref,
        locationAddress,
        locationNotes,
        assignedToUserId,
        assignedToName,
        assignedToRole,
        "temp-user-id", // Temporary placeholder
        createdByName || "System User", // Temporary placeholder
        priority,
        isRecurring ? 1 : 0,
        recurringPattern,
        preparationNotes,
      ],
    )

    const appointmentId = result[0].appointment_id
    console.log(`✅ [API] Created appointment with ID: ${appointmentId}`)

    return NextResponse.json(
      {
        success: true,
        appointmentId,
        message: "Appointment created successfully",
        timestamp: new Date().toISOString(),
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("❌ [API] Error creating appointment:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create appointment",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

// PUT - Update existing appointment
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      appointmentId,
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
      status,
      preparationNotes,
    } = body

    // Validation
    if (!appointmentId) {
      return NextResponse.json({ error: "Missing required field: appointmentId" }, { status: 400 })
    }

    if (!title || !startDateTime || !endDateTime || !assignedToUserId || !assignedToName) {
      return NextResponse.json(
        { error: "Missing required fields: title, startDateTime, endDateTime, assignedToUserId, assignedToName" },
        { status: 400 },
      )
    }

    // Check if appointment exists
    const existingAppointment = await query(
      "SELECT appointment_id FROM appointments WHERE appointment_id = @param0 AND is_deleted = 0",
      [appointmentId],
    )

    if (existingAppointment.length === 0) {
      return NextResponse.json({ error: "Appointment not found" }, { status: 404 })
    }

    // Validate home exists if provided
    if (homeXref) {
      const homeExists = await query("SELECT COUNT(*) as count FROM SyncActiveHomes WHERE Xref = @param0", [homeXref])

      if (homeExists[0].count === 0) {
        return NextResponse.json({ error: "Selected home does not exist" }, { status: 400 })
      }
    }

    // Validate dates
    const start = new Date(startDateTime)
    const end = new Date(endDateTime)
    if (start >= end) {
      return NextResponse.json({ error: "End time must be after start time" }, { status: 400 })
    }

    console.log("📝 [API] Updating appointment:", { appointmentId, title, assignedToName })

    await query(
      `
      UPDATE appointments SET
        title = @param1,
        description = @param2,
        appointment_type = @param3,
        start_datetime = @param4,
        end_datetime = @param5,
        home_xref = @param6,
        location_address = @param7,
        location_notes = @param8,
        assigned_to_user_id = @param9,
        assigned_to_name = @param10,
        assigned_to_role = @param11,
        priority = @param12,
        status = @param13,
        preparation_notes = @param14,
        updated_at = GETUTCDATE()
      WHERE appointment_id = @param0 AND is_deleted = 0
    `,
      [
        appointmentId,
        title,
        description,
        appointmentType,
        start,
        end,
        homeXref,
        locationAddress,
        locationNotes,
        assignedToUserId,
        assignedToName,
        assignedToRole,
        priority,
        status || "scheduled",
        preparationNotes,
      ],
    )

    console.log(`✅ [API] Updated appointment with ID: ${appointmentId}`)

    return NextResponse.json({
      success: true,
      appointmentId,
      message: "Appointment updated successfully",
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("❌ [API] Error updating appointment:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update appointment",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
