import { NextResponse, type NextRequest } from "next/server"
import { query } from "@/lib/db"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

// GET - Fetch single appointment
export async function GET(request: NextRequest, { params }: { params: { appointmentId: string } }) {
  try {
    const { appointmentId } = params

    console.log(`📅 [API] Fetching appointment: ${appointmentId}`)

    const appointments = await query(
      `
      SELECT 
        a.*,
        h.HomeName as sync_home_name,
        h.Street,
        h.City,
        h.State,
        h.Zip,
        h.CaseManager,
        h.HomePhone,
        h.CaseManagerEmail
      FROM appointments a
      LEFT JOIN SyncActiveHomes h ON a.home_xref = h.Xref
      WHERE a.appointment_id = @param0 AND a.is_deleted = 0
    `,
      [appointmentId],
    )

    if (appointments.length === 0) {
      return NextResponse.json({ error: "Appointment not found" }, { status: 404 })
    }

    const appointment = appointments[0]
    console.log(`✅ [API] Retrieved appointment: ${appointment.title}`)

    return NextResponse.json({
      success: true,
      appointment: {
        ...appointment,
        start_datetime: new Date(appointment.start_datetime).toISOString(),
        end_datetime: new Date(appointment.end_datetime).toISOString(),
        created_at: new Date(appointment.created_at).toISOString(),
        updated_at: new Date(appointment.updated_at).toISOString(),
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("❌ [API] Error fetching appointment:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch appointment",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

// PUT - Update appointment
export async function PUT(request: NextRequest, { params }: { params: { appointmentId: string } }) {
  try {
    const { appointmentId } = params
    const body = await request.json()

    console.log(`📅 [API] Updating appointment: ${appointmentId}`)
    console.log(`📝 [API] Request body:`, JSON.stringify(body, null, 2))

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
    } = body

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
      queryParams.push(new Date(startDateTime))
      paramIndex++
    }

    if (endDateTime !== undefined) {
      updateFields.push(`end_datetime = @param${paramIndex}`)
      queryParams.push(new Date(endDateTime))
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

    // Always update the updated_by_user_id and updated_at fields
    updateFields.push(`updated_by_user_id = @param${paramIndex}`)
    queryParams.push("system") // Use system user instead of Clerk userId
    paramIndex++

    updateFields.push(`updated_at = @param${paramIndex}`)
    queryParams.push(new Date())
    paramIndex++

    if (updateFields.length === 2) {
      // Only updated_by_user_id and updated_at
      console.log(`❌ [API] No fields to update for appointment: ${appointmentId}`)
      return NextResponse.json({ error: "No fields to update" }, { status: 400 })
    }

    // Add appointment ID as the last parameter
    queryParams.push(appointmentId)

    const updateQuery = `
      UPDATE appointments 
      SET ${updateFields.join(", ")}
      WHERE appointment_id = @param${paramIndex} AND is_deleted = 0
    `

    console.log(`🔍 [API] Generated SQL query:`, updateQuery)
    console.log(`📊 [API] Query parameters:`, queryParams)

    const result = await query(updateQuery, queryParams)

    console.log(`📈 [API] Query result:`, result)
    console.log(`✅ [API] Updated appointment: ${appointmentId}`)

    return NextResponse.json({
      success: true,
      message: "Appointment updated successfully",
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("❌ [API] Error updating appointment:", error)
    console.error("❌ [API] Error stack:", error instanceof Error ? error.stack : "No stack trace")
    console.error("❌ [API] Appointment ID:", params.appointmentId)

    return NextResponse.json(
      {
        success: false,
        error: "Failed to update appointment",
        details: error instanceof Error ? error.message : "Unknown error",
        appointmentId: params.appointmentId,
      },
      { status: 500 },
    )
  }
}

// DELETE - Soft delete appointment
export async function DELETE(request: NextRequest, { params }: { params: { appointmentId: string } }) {
  try {
    const { appointmentId } = params

    console.log(`📅 [API] Deleting appointment: ${appointmentId}`)

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
      ["system", appointmentId], // Use system user instead of Clerk userId
    )

    console.log(`✅ [API] Deleted appointment: ${appointmentId}`)

    return NextResponse.json({
      success: true,
      message: "Appointment deleted successfully",
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("❌ [API] Error deleting appointment:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete appointment",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
