import { NextRequest, NextResponse } from "next/server"
import { validateApiKey } from "@/lib/api-auth"
import { query } from "@refugehouse/shared-core/db"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"
export const maxDuration = 60

/**
 * GET /api/radius/appointments/[id]
 * 
 * Get a specific appointment by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const appointmentId = params.id

    // 2. Query appointment
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
      WHERE a.appointment_id = @param0 AND a.is_deleted = 0
    `,
      [appointmentId]
    )

    if (appointments.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Appointment not found",
        },
        { status: 404 }
      )
    }

    const appointment = appointments[0]
    const duration = Date.now() - startTime

    return NextResponse.json({
      success: true,
      appointment,
      timestamp: new Date().toISOString(),
      duration_ms: duration,
    })
  } catch (error) {
    const duration = Date.now() - startTime
    console.error("❌ [RADIUS-API] Error in appointments GET [id]:", error)

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

/**
 * PUT /api/radius/appointments/[id]
 * 
 * Update an existing appointment
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const appointmentId = params.id
    const body = await request.json()
    const {
      title,
      description,
      appointmentType,
      startDateTime,
      endDateTime,
      status,
      homeXref,
      locationAddress,
      locationNotes,
      assignedToUserId,
      assignedToName,
      assignedToRole,
      priority,
      preparationNotes,
      completionNotes,
      outcome,
      // Mileage tracking fields
      startDriveLatitude,
      startDriveLongitude,
      startDriveTimestamp,
      arrivedLatitude,
      arrivedLongitude,
      arrivedTimestamp,
      calculatedMileage,
      estimatedTollCost,
      returnLatitude,
      returnLongitude,
      returnTimestamp,
      returnMileage,
    } = body

    // 2. Check if appointment exists
    const existingAppointment = await query(
      "SELECT appointment_id FROM appointments WHERE appointment_id = @param0 AND is_deleted = 0",
      [appointmentId]
    )

    if (existingAppointment.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Appointment not found",
        },
        { status: 404 }
      )
    }

    // 3. Build dynamic update query
    const updateFields: string[] = []
    const queryParams: any[] = []
    let paramIndex = 0

    if (title !== undefined) {
      updateFields.push(`title = @param${paramIndex}`)
      queryParams.push(title)
      paramIndex++
    }

    if (description !== undefined) {
      updateFields.push(`description = @param${paramIndex}`)
      queryParams.push(description)
      paramIndex++
    }

    if (appointmentType !== undefined) {
      updateFields.push(`appointment_type = @param${paramIndex}`)
      queryParams.push(appointmentType)
      paramIndex++
    }

    if (startDateTime !== undefined) {
      updateFields.push(`start_datetime = @param${paramIndex}`)
      // Parse as local time if string (no timezone conversion)
      let startDate: Date
      if (typeof startDateTime === 'string') {
        const [datePart, timePart] = startDateTime.split('T')
        const [year, month, day] = datePart.split('-').map(Number)
        const [hour, minute, second] = (timePart || '').split(':').map(Number)
        startDate = new Date(year, month - 1, day, hour || 0, minute || 0, second || 0)
      } else {
        startDate = new Date(startDateTime)
      }
      queryParams.push(startDate)
      paramIndex++
    }

    if (endDateTime !== undefined) {
      updateFields.push(`end_datetime = @param${paramIndex}`)
      // Parse as local time if string (no timezone conversion)
      let endDate: Date
      if (typeof endDateTime === 'string') {
        const [datePart, timePart] = endDateTime.split('T')
        const [year, month, day] = datePart.split('-').map(Number)
        const [hour, minute, second] = (timePart || '').split(':').map(Number)
        endDate = new Date(year, month - 1, day, hour || 0, minute || 0, second || 0)
      } else {
        endDate = new Date(endDateTime)
      }
      queryParams.push(endDate)
      paramIndex++
    }

    if (status !== undefined) {
      updateFields.push(`status = @param${paramIndex}`)
      queryParams.push(status)
      paramIndex++
    }

    if (homeXref !== undefined) {
      updateFields.push(`home_xref = @param${paramIndex}`)
      queryParams.push(homeXref)
      paramIndex++
    }

    if (locationAddress !== undefined) {
      updateFields.push(`location_address = @param${paramIndex}`)
      queryParams.push(locationAddress)
      paramIndex++
    }

    if (locationNotes !== undefined) {
      updateFields.push(`location_notes = @param${paramIndex}`)
      queryParams.push(locationNotes)
      paramIndex++
    }

    if (assignedToUserId !== undefined) {
      updateFields.push(`assigned_to_user_id = @param${paramIndex}`)
      queryParams.push(assignedToUserId)
      paramIndex++
    }

    if (assignedToName !== undefined) {
      updateFields.push(`assigned_to_name = @param${paramIndex}`)
      queryParams.push(assignedToName)
      paramIndex++
    }

    if (assignedToRole !== undefined) {
      updateFields.push(`assigned_to_role = @param${paramIndex}`)
      queryParams.push(assignedToRole)
      paramIndex++
    }

    if (priority !== undefined) {
      updateFields.push(`priority = @param${paramIndex}`)
      queryParams.push(priority)
      paramIndex++
    }

    if (preparationNotes !== undefined) {
      updateFields.push(`preparation_notes = @param${paramIndex}`)
      queryParams.push(preparationNotes)
      paramIndex++
    }

    if (completionNotes !== undefined) {
      updateFields.push(`completion_notes = @param${paramIndex}`)
      queryParams.push(completionNotes)
      paramIndex++
    }

    if (outcome !== undefined) {
      updateFields.push(`outcome = @param${paramIndex}`)
      queryParams.push(outcome)
      paramIndex++
    }

    // Mileage tracking fields
    if (startDriveLatitude !== undefined) {
      updateFields.push(`start_drive_latitude = @param${paramIndex}`)
      queryParams.push(startDriveLatitude)
      paramIndex++
    }

    if (startDriveLongitude !== undefined) {
      updateFields.push(`start_drive_longitude = @param${paramIndex}`)
      queryParams.push(startDriveLongitude)
      paramIndex++
    }

    if (startDriveTimestamp !== undefined) {
      updateFields.push(`start_drive_timestamp = @param${paramIndex}`)
      queryParams.push(startDriveTimestamp instanceof Date ? startDriveTimestamp : new Date(startDriveTimestamp))
      paramIndex++
    }

    if (arrivedLatitude !== undefined) {
      updateFields.push(`arrived_latitude = @param${paramIndex}`)
      queryParams.push(arrivedLatitude)
      paramIndex++
    }

    if (arrivedLongitude !== undefined) {
      updateFields.push(`arrived_longitude = @param${paramIndex}`)
      queryParams.push(arrivedLongitude)
      paramIndex++
    }

    if (arrivedTimestamp !== undefined) {
      updateFields.push(`arrived_timestamp = @param${paramIndex}`)
      queryParams.push(arrivedTimestamp instanceof Date ? arrivedTimestamp : new Date(arrivedTimestamp))
      paramIndex++
    }

    if (calculatedMileage !== undefined) {
      updateFields.push(`calculated_mileage = @param${paramIndex}`)
      queryParams.push(calculatedMileage)
      paramIndex++
    }

    if (estimatedTollCost !== undefined) {
      updateFields.push(`estimated_toll_cost = @param${paramIndex}`)
      queryParams.push(estimatedTollCost)
      paramIndex++
    }

    if (returnLatitude !== undefined) {
      updateFields.push(`return_latitude = @param${paramIndex}`)
      queryParams.push(returnLatitude)
      paramIndex++
    }

    if (returnLongitude !== undefined) {
      updateFields.push(`return_longitude = @param${paramIndex}`)
      queryParams.push(returnLongitude)
      paramIndex++
    }

    if (returnTimestamp !== undefined) {
      updateFields.push(`return_timestamp = @param${paramIndex}`)
      queryParams.push(returnTimestamp instanceof Date ? returnTimestamp : new Date(returnTimestamp))
      paramIndex++
    }

    if (returnMileage !== undefined) {
      updateFields.push(`return_mileage = @param${paramIndex}`)
      queryParams.push(returnMileage)
      paramIndex++
    }

    // Always update updated_at
    updateFields.push(`updated_at = GETUTCDATE()`)

    if (updateFields.length === 1) {
      // Only updated_at
      return NextResponse.json(
        { success: false, error: "No fields to update" },
        { status: 400 }
      )
    }

    // Add appointment ID as the last parameter
    queryParams.push(appointmentId)

    // 4. Update appointment
    await query(
      `
      UPDATE appointments 
      SET ${updateFields.join(", ")}
      WHERE appointment_id = @param${paramIndex} AND is_deleted = 0
    `,
      queryParams
    )

    const duration = Date.now() - startTime
    console.log(`✅ [RADIUS-API] Updated appointment ${appointmentId} in ${duration}ms`)

    return NextResponse.json({
      success: true,
      appointmentId,
      message: "Appointment updated successfully",
      timestamp: new Date().toISOString(),
      duration_ms: duration,
    })
  } catch (error) {
    const duration = Date.now() - startTime
    console.error("❌ [RADIUS-API] Error in appointments PUT [id]:", error)

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

/**
 * DELETE /api/radius/appointments/[id]
 * 
 * Soft delete an appointment
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const appointmentId = params.id
    const body = await request.json().catch(() => ({}))
    const { deletedByUserId, deletedByName } = body

    // 2. Check if appointment exists
    const existingAppointment = await query(
      "SELECT appointment_id FROM appointments WHERE appointment_id = @param0 AND is_deleted = 0",
      [appointmentId]
    )

    if (existingAppointment.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Appointment not found",
        },
        { status: 404 }
      )
    }

    // 3. Soft delete related visit forms
    const visitForms = await query(
      `SELECT visit_form_id FROM visit_forms WHERE appointment_id = @param0 AND is_deleted = 0`,
      [appointmentId]
    )

    if (visitForms.length > 0) {
      for (const form of visitForms) {
        await query(
          `
          UPDATE visit_forms 
          SET 
            is_deleted = 1,
            deleted_at = GETUTCDATE(),
            deleted_by_user_id = @param0,
            deleted_by_name = @param1,
            updated_at = GETUTCDATE()
          WHERE visit_form_id = @param2 AND is_deleted = 0
        `,
          [deletedByUserId || "system", deletedByName || "System", form.visit_form_id]
        )
      }
    }

    // 4. Soft delete appointment
    await query(
      `
      UPDATE appointments 
      SET 
        is_deleted = 1,
        deleted_at = GETUTCDATE(),
        deleted_by_user_id = @param0,
        updated_at = GETUTCDATE(),
        updated_by_user_id = @param0
      WHERE appointment_id = @param1 AND is_deleted = 0
    `,
      [deletedByUserId || "system", appointmentId]
    )

    const duration = Date.now() - startTime
    console.log(`✅ [RADIUS-API] Soft deleted appointment ${appointmentId} in ${duration}ms`)

    return NextResponse.json({
      success: true,
      appointmentId,
      message: "Appointment deleted successfully",
      deletedVisitForms: visitForms.length,
      timestamp: new Date().toISOString(),
      duration_ms: duration,
    })
  } catch (error) {
    const duration = Date.now() - startTime
    console.error("❌ [RADIUS-API] Error in appointments DELETE [id]:", error)

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

