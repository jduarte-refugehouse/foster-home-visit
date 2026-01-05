import { NextResponse, type NextRequest } from "next/server"
import { query } from "@refugehouse/shared-core/db"
import { getMicroserviceCode, shouldUseRadiusApiClient, throwIfDirectDbNotAllowed } from "@/lib/microservice-config"
import { radiusApiClient } from "@refugehouse/radius-api-client"
import { addNoCacheHeaders, DYNAMIC_ROUTE_CONFIG } from "@/lib/api-cache-utils"

export const dynamic = DYNAMIC_ROUTE_CONFIG.dynamic
export const revalidate = DYNAMIC_ROUTE_CONFIG.revalidate
export const fetchCache = DYNAMIC_ROUTE_CONFIG.fetchCache
export const runtime = "nodejs"

// GET - Fetch appointments with optional filtering
export async function GET(request: NextRequest) {
  try {
    console.log("🔍 [API] Fetching appointments")

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

    const microserviceCode = getMicroserviceCode()
    const useApiClient = shouldUseRadiusApiClient()

    let appointments: any[]

    if (useApiClient) {
      // Use Radius API client for non-admin microservices
      console.log(`✅ [API] Using API client for appointments (microservice: ${microserviceCode})`)
      
      const apiAppointments = await radiusApiClient.getAppointments({
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        assignedTo: assignedTo || undefined,
        status: status || undefined,
        type: appointmentType || undefined,
      })

      // Filter out deleted appointments (API should handle this, but ensure it)
      appointments = apiAppointments.filter((apt: any) => !apt.is_deleted)
      
      // Sort by start_datetime ASC (API returns DESC, so reverse)
      appointments.sort((a, b) => {
        const aDate = new Date(a.start_datetime).getTime()
        const bDate = new Date(b.start_datetime).getTime()
        return aDate - bDate
      })
    } else {
      // Direct database access for admin microservice
      console.log(`⚠️ [API] Using direct DB access for appointments (admin microservice)`)
      
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

      appointments = await query(
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
    }

    console.log(`✅ [API] Retrieved ${appointments.length} appointments`)

    // Transform appointments to include home_info (for both API client and direct DB responses)
    const transformedAppointments = appointments.map((appointment) => ({
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
      // Return datetime strings WITHOUT timezone conversion
      // SQL Server DATETIME2 has no timezone, so we return as-is (local time)
      // The calendar will parse these as local time using parseLocalDatetime
      start_datetime: appointment.start_datetime,
      end_datetime: appointment.end_datetime,
      created_at: appointment.created_at ? new Date(appointment.created_at).toISOString() : null,
      updated_at: appointment.updated_at ? new Date(appointment.updated_at).toISOString() : null,
    }))

    const response = NextResponse.json({
      success: true,
      count: transformedAppointments.length,
      appointments: transformedAppointments,
      timestamp: new Date().toISOString(),
    })
    return addNoCacheHeaders(response)
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

    // Validation - allow unassigned appointments (assignedToUserId and assignedToName can be null/empty)
    if (!title || !startDateTime || !endDateTime) {
      return NextResponse.json(
        { error: "Missing required fields: title, startDateTime, endDateTime" },
        { status: 400 },
      )
    }
    
    // If assigned, both userId and name should be provided
    if ((assignedToUserId && !assignedToName) || (!assignedToUserId && assignedToName)) {
      return NextResponse.json(
        { error: "If assigning to a user, both assignedToUserId and assignedToName are required" },
        { status: 400 },
      )
    }

    if (homeXref) {
      const homeExists = await query("SELECT COUNT(*) as count FROM SyncActiveHomes WHERE Xref = @param0", [homeXref])

      if (homeExists[0].count === 0) {
        return NextResponse.json({ error: "Selected home does not exist" }, { status: 400 })
      }
    }

    // IMPORTANT: SQL Server DATETIME2 has no timezone, so we store the literal datetime value
    // The datetime string comes in format "YYYY-MM-DDTHH:mm:ss" (no timezone)
    // We pass the string directly to SQL Server to avoid timezone conversion
    let startStr: string
    let endStr: string
    
    if (typeof startDateTime === 'string') {
      // Validate format: YYYY-MM-DDTHH:mm:ss
      if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(startDateTime)) {
        return NextResponse.json({ error: "Invalid startDateTime format. Expected YYYY-MM-DDTHH:mm:ss" }, { status: 400 })
      }
      startStr = startDateTime
    } else {
      // If it's a Date object, format it as local time string (no UTC conversion)
      const date = new Date(startDateTime)
      const pad = (n: number) => n.toString().padStart(2, '0')
      startStr = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
    }
    
    if (typeof endDateTime === 'string') {
      // Validate format: YYYY-MM-DDTHH:mm:ss
      if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(endDateTime)) {
        return NextResponse.json({ error: "Invalid endDateTime format. Expected YYYY-MM-DDTHH:mm:ss" }, { status: 400 })
      }
      endStr = endDateTime
    } else {
      // If it's a Date object, format it as local time string (no UTC conversion)
      const date = new Date(endDateTime)
      const pad = (n: number) => n.toString().padStart(2, '0')
      endStr = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
    }
    
    // Validate that end is after start by parsing as local time
    const [startDatePart, startTimePart] = startStr.split('T')
    const [startYear, startMonth, startDay] = startDatePart.split('-').map(Number)
    const [startHour, startMinute] = startTimePart.split(':').map(Number)
    const startDate = new Date(startYear, startMonth - 1, startDay, startHour, startMinute, 0)
    
    const [endDatePart, endTimePart] = endStr.split('T')
    const [endYear, endMonth, endDay] = endDatePart.split('-').map(Number)
    const [endHour, endMinute] = endTimePart.split(':').map(Number)
    const endDate = new Date(endYear, endMonth - 1, endDay, endHour, endMinute, 0)
    
    if (startDate >= endDate) {
      return NextResponse.json({ error: "End time must be after start time" }, { status: 400 })
    }
    console.log("📅 [API] Creating new appointment:", { 
      title, 
      appointmentType, 
      assignedToName,
      startDateTime: startStr,
      endDateTime: endStr,
    })

    const useApiClient = shouldUseRadiusApiClient()

    if (useApiClient) {
      // Use API client to create appointment
      try {
        const appointmentData = {
          title,
          description,
          appointmentType,
          startDateTime: startStr,
          endDateTime: endStr,
          homeXref,
          locationAddress,
          locationNotes,
          assignedToUserId,
          assignedToName,
          assignedToRole,
          priority,
          isRecurring,
          recurringPattern,
          preparationNotes,
          createdByName,
        }

        console.log(`📤 [API] Sending appointment data to API Hub:`, {
          title,
          appointmentType,
          startDateTime: startStr,
          endDateTime: endStr,
          homeXref,
          assignedToName,
        })

        const result = await radiusApiClient.createAppointment(appointmentData)
        console.log(`✅ [API] Created appointment with ID: ${result.appointmentId} via API Hub`)

        return NextResponse.json(
          {
            success: true,
            appointmentId: result.appointmentId,
            message: result.message || "Appointment created successfully",
            timestamp: new Date().toISOString(),
          },
          { status: 201 },
        )
      } catch (apiError: any) {
        console.error("❌ [API] Error from API client when creating appointment:", apiError)
        console.error("❌ [API] API error details:", {
          message: apiError?.message,
          status: apiError?.status,
          statusText: apiError?.statusText,
          response: apiError?.response,
          stack: apiError?.stack,
        })
        // Re-throw to be caught by outer catch block
        throw apiError
      }
    } else {
      // Direct DB access for admin microservice
      throwIfDirectDbNotAllowed("appointments POST endpoint")
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
          startStr, // Pass as string to avoid timezone conversion
          endStr, // Pass as string to avoid timezone conversion
          homeXref,
          locationAddress,
          locationNotes,
          assignedToUserId || null,
          assignedToName || null,
          assignedToRole || null,
          "temp-user-id", // Temporary placeholder
          createdByName || "System User", // Temporary placeholder
          priority,
          isRecurring ? 1 : 0,
          recurringPattern || null,
          preparationNotes || null,
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
    }
  } catch (error) {
    console.error("❌ [API] Error creating appointment:", error)
    console.error("❌ [API] Error details:", {
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined,
      // Check if it's an API client error
      status: (error as any)?.status,
      statusText: (error as any)?.statusText,
      response: (error as any)?.response,
    })
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create appointment",
        details: error instanceof Error ? error.message : "Unknown error",
        // Include API client error details if available
        apiError: (error as any)?.status ? {
          status: (error as any).status,
          statusText: (error as any).statusText,
          message: (error as any).response?.error || (error as any).message,
        } : undefined,
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

    const useApiClient = shouldUseRadiusApiClient()
    
    // Check if appointment exists
    if (useApiClient) {
      // Use API client to check if appointment exists
      try {
        await radiusApiClient.getAppointment(appointmentId)
        console.log(`✅ [API] Appointment validation passed: ${appointmentId}`)
      } catch (error: any) {
        if (error?.status === 404 || error?.response?.status === 404) {
          return NextResponse.json({ error: "Appointment not found" }, { status: 404 })
        }
        // Re-throw other errors
        throw error
      }
    } else {
      // Direct DB access for admin microservice
      throwIfDirectDbNotAllowed("appointments PUT - appointment validation")
      const existingAppointment = await query(
        "SELECT appointment_id FROM appointments WHERE appointment_id = @param0 AND is_deleted = 0",
        [appointmentId],
      )

      if (existingAppointment.length === 0) {
        return NextResponse.json({ error: "Appointment not found" }, { status: 404 })
      }
    }

    // Validate home exists if provided
    if (homeXref) {
      if (useApiClient) {
        // Use API client to validate home exists
        try {
          const home = await radiusApiClient.lookupHomeByXref(homeXref)
          console.log(`✅ [API] Home validation passed: ${home.name} (${home.guid})`)
        } catch (error: any) {
          if (error?.status === 404 || error?.response?.status === 404) {
            return NextResponse.json({ error: "Selected home does not exist" }, { status: 400 })
          }
          // If it's a different error, log it but don't fail the appointment update
          console.warn(`⚠️ [API] Error validating home (non-blocking):`, error)
        }
      } else {
        // Direct DB access for admin microservice
        throwIfDirectDbNotAllowed("appointments PUT - home validation")
        const homeExists = await query("SELECT COUNT(*) as count FROM SyncActiveHomes WHERE Xref = @param0", [homeXref])

        if (homeExists[0].count === 0) {
          return NextResponse.json({ error: "Selected home does not exist" }, { status: 400 })
        }
      }
    }

    // IMPORTANT: SQL Server DATETIME2 has no timezone, so we store the literal datetime value
    // The datetime string comes in format "YYYY-MM-DDTHH:mm:ss" (no timezone)
    // We pass the string directly to SQL Server to avoid timezone conversion
    let startStr: string
    let endStr: string
    
    if (typeof startDateTime === 'string') {
      // Validate format: YYYY-MM-DDTHH:mm:ss
      if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(startDateTime)) {
        return NextResponse.json({ error: "Invalid startDateTime format. Expected YYYY-MM-DDTHH:mm:ss" }, { status: 400 })
      }
      startStr = startDateTime
    } else {
      // If it's a Date object, format it as local time string (no UTC conversion)
      const date = new Date(startDateTime)
      const pad = (n: number) => n.toString().padStart(2, '0')
      startStr = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
    }
    
    if (typeof endDateTime === 'string') {
      // Validate format: YYYY-MM-DDTHH:mm:ss
      if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(endDateTime)) {
        return NextResponse.json({ error: "Invalid endDateTime format. Expected YYYY-MM-DDTHH:mm:ss" }, { status: 400 })
      }
      endStr = endDateTime
    } else {
      // If it's a Date object, format it as local time string (no UTC conversion)
      const date = new Date(endDateTime)
      const pad = (n: number) => n.toString().padStart(2, '0')
      endStr = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
    }
    
    // Validate that end is after start by parsing as local time
    const [startDatePart, startTimePart] = startStr.split('T')
    const [startYear, startMonth, startDay] = startDatePart.split('-').map(Number)
    const [startHour, startMinute] = startTimePart.split(':').map(Number)
    const startDate = new Date(startYear, startMonth - 1, startDay, startHour, startMinute, 0)
    
    const [endDatePart, endTimePart] = endStr.split('T')
    const [endYear, endMonth, endDay] = endDatePart.split('-').map(Number)
    const [endHour, endMinute] = endTimePart.split(':').map(Number)
    const endDate = new Date(endYear, endMonth - 1, endDay, endHour, endMinute, 0)
    
    if (startDate >= endDate) {
      return NextResponse.json({ error: "End time must be after start time" }, { status: 400 })
    }

    console.log("📝 [API] Updating appointment:", { 
      appointmentId, 
      title, 
      assignedToName,
      startDateTime: startStr,
      endDateTime: endStr,
    })

    if (useApiClient) {
      // Use API client to update appointment
      const updateData = {
        title,
        description,
        appointmentType,
        startDateTime: startStr,
        endDateTime: endStr,
        homeXref,
        locationAddress,
        locationNotes,
        assignedToUserId,
        assignedToName,
        assignedToRole,
        priority,
        status: status || "scheduled",
        preparationNotes,
      }

      const result = await radiusApiClient.updateAppointment(appointmentId, updateData)
      console.log(`✅ [API] Updated appointment with ID: ${appointmentId} via API Hub`)

      return NextResponse.json({
        success: true,
        appointmentId,
        message: result.message || "Appointment updated successfully",
        timestamp: new Date().toISOString(),
      })
    } else {
      // Direct DB access for admin microservice
      throwIfDirectDbNotAllowed("appointments PUT endpoint")
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
          startStr, // Pass as string to avoid timezone conversion
          endStr, // Pass as string to avoid timezone conversion
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
    }
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
