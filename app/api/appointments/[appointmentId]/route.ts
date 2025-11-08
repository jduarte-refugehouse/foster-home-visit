import { NextResponse, type NextRequest } from "next/server"
import { query } from "@/lib/db"
import { getClerkUserIdFromRequest } from "@/lib/clerk-auth-helper"

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

    // Format datetime as local time string (no timezone conversion)
    // SQL Server DATETIME2 has no timezone, so we return as local time string
    const formatLocalDatetime = (dt: any): string => {
      if (!dt) return ""
      // If it's already a string in format YYYY-MM-DDTHH:mm:ss, return as-is
      if (typeof dt === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(dt)) {
        return dt.split('.')[0].split('Z')[0] // Remove milliseconds and Z if present
      }
      // If it's a Date object or SQL datetime, format as local time
      const date = new Date(dt)
      const pad = (n: number) => n.toString().padStart(2, '0')
      return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
    }

    return NextResponse.json({
      success: true,
      appointment: {
        ...appointment,
        // Return datetime strings WITHOUT timezone conversion
        // The form will parse these as local time
        start_datetime: formatLocalDatetime(appointment.start_datetime),
        end_datetime: formatLocalDatetime(appointment.end_datetime),
        created_at: appointment.created_at ? new Date(appointment.created_at).toISOString() : null,
        updated_at: appointment.updated_at ? new Date(appointment.updated_at).toISOString() : null,
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
  let body: any = null
  try {
    const { appointmentId } = params
    body = await request.json()

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
      tollConfirmed,
      actualTollCost,
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

    if (tollConfirmed !== undefined) {
      updateFields.push(`toll_confirmed = @param${paramIndex}`)
      queryParams.push(tollConfirmed ? 1 : 0)
      paramIndex++
    }

    if (actualTollCost !== undefined) {
      updateFields.push(`actual_toll_cost = @param${paramIndex}`)
      queryParams.push(actualTollCost !== null ? actualTollCost : null)
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
    if (body) {
      console.error("❌ [API] Request body:", JSON.stringify(body, null, 2))
    } else {
      console.error("❌ [API] Request body: (could not parse)")
    }
    
    // Log SQL Server specific error details
    if (error && typeof error === 'object' && 'number' in error) {
      console.error("❌ [API] SQL Error Number:", (error as any).number)
      console.error("❌ [API] SQL Error State:", (error as any).state)
      console.error("❌ [API] SQL Error Class:", (error as any).class)
      console.error("❌ [API] SQL Error Procedure:", (error as any).procedure)
      console.error("❌ [API] SQL Error Line Number:", (error as any).lineNumber)
    }

    return NextResponse.json(
      {
        success: false,
        error: "Failed to update appointment",
        details: error instanceof Error ? error.message : "Unknown error",
        appointmentId: params.appointmentId,
        sqlError: error && typeof error === 'object' && 'number' in error ? {
          number: (error as any).number,
          state: (error as any).state,
          message: (error as any).message,
        } : undefined,
      },
      { status: 500 },
    )
  }
}

// DELETE - Soft delete appointment and all related documentation
// ONLY available to jduarte@refugehouse.org for testing purposes
export async function DELETE(request: NextRequest, { params }: { params: { appointmentId: string } }) {
  try {
    const { appointmentId } = params

    // Check authorization - ONLY jduarte@refugehouse.org can delete
    const { email } = getClerkUserIdFromRequest(request)
    const AUTHORIZED_EMAIL = "jduarte@refugehouse.org"

    if (!email || email.toLowerCase() !== AUTHORIZED_EMAIL.toLowerCase()) {
      console.log(`❌ [API] Unauthorized delete attempt by: ${email}`)
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
          message: "Only authorized administrators can delete appointments",
        },
        { status: 403 },
      )
    }

    console.log(`📅 [API] Authorized delete request for appointment: ${appointmentId} by ${email}`)

    // First, soft delete all related visit forms
    const visitForms = await query(
      `SELECT visit_form_id FROM visit_forms WHERE appointment_id = @param0 AND is_deleted = 0`,
      [appointmentId],
    )

    if (visitForms.length > 0) {
      console.log(`🗑️ [API] Deleting ${visitForms.length} related visit form(s)`)
      
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
          ["system", "System Administrator", form.visit_form_id],
        )
      }
      
      console.log(`✅ [API] Deleted ${visitForms.length} visit form(s)`)
    }

    // Soft delete all related continuum entries
    const continuumEntries = await query(
      `SELECT entry_id FROM continuum_entries WHERE appointment_id = @param0 AND is_deleted = 0`,
      [appointmentId],
    )

    if (continuumEntries.length > 0) {
      console.log(`🗑️ [API] Deleting ${continuumEntries.length} related continuum entry/entries`)
      
      await query(
        `
        UPDATE continuum_entries 
        SET is_deleted = 1
        WHERE appointment_id = @param0 AND is_deleted = 0
      `,
        [appointmentId],
      )
      
      console.log(`✅ [API] Deleted ${continuumEntries.length} continuum entry/entries`)
    }

    // Then soft delete the appointment
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
      ["system", appointmentId],
    )

    console.log(`✅ [API] Deleted appointment: ${appointmentId} and ${visitForms.length} related visit form(s)`)

    return NextResponse.json({
      success: true,
      message: "Appointment and all related documentation deleted successfully",
      deletedVisitForms: visitForms.length,
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
