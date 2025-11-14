import { NextRequest, NextResponse } from "next/server"
import { getClerkUserIdFromRequest } from "@/lib/clerk-auth-helper"
import { query } from "@/lib/db"

export const dynamic = "force-dynamic"

// GET - Fetch training summary
export async function GET(
  request: NextRequest,
  { params }: { params: { appointmentId: string } }
) {
  try {
    const { appointmentId } = params
    const authInfo = getClerkUserIdFromRequest(request)

    if (!authInfo.clerkUserId && !authInfo.email) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    // Fetch appointment to verify it exists and is staff_training type
    const appointments = await query(
      `SELECT appointment_id, appointment_type, completion_notes
       FROM dbo.appointments
       WHERE appointment_id = @param0 AND is_deleted = 0`,
      [appointmentId]
    )

    if (appointments.length === 0) {
      return NextResponse.json({ error: "Appointment not found" }, { status: 404 })
    }

    const appointment = appointments[0]

    // Return completion_notes as summary (even if null/empty)
    return NextResponse.json({
      success: true,
      summary: appointment.completion_notes || "",
      appointmentType: appointment.appointment_type,
    })
  } catch (error: any) {
    console.error("❌ [API] Error fetching training summary:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch training summary",
        details: error.message,
      },
      { status: 500 }
    )
  }
}

// PUT - Save training summary
export async function PUT(
  request: NextRequest,
  { params }: { params: { appointmentId: string } }
) {
  try {
    const { appointmentId } = params
    const authInfo = getClerkUserIdFromRequest(request)

    if (!authInfo.clerkUserId && !authInfo.email) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const body = await request.json()
    const { summary } = body

    if (summary === undefined) {
      return NextResponse.json({ error: "Summary is required" }, { status: 400 })
    }

    // Verify appointment exists and is staff_training type
    const appointments = await query(
      `SELECT appointment_id, appointment_type
       FROM dbo.appointments
       WHERE appointment_id = @param0 AND is_deleted = 0`,
      [appointmentId]
    )

    if (appointments.length === 0) {
      return NextResponse.json({ error: "Appointment not found" }, { status: 404 })
    }

    const appointment = appointments[0]

    if (appointment.appointment_type !== "staff_training") {
      return NextResponse.json(
        { error: "This endpoint is only for staff training appointments" },
        { status: 400 }
      )
    }

    // Update completion_notes with the summary
    await query(
      `UPDATE dbo.appointments
       SET completion_notes = @param0,
           updated_at = GETUTCDATE(),
           updated_by_user_id = @param1
       WHERE appointment_id = @param2 AND is_deleted = 0`,
      [summary || null, authInfo.clerkUserId || authInfo.email || "system", appointmentId]
    )

    return NextResponse.json({
      success: true,
      message: "Training summary saved successfully",
      summary: summary || "",
    })
  } catch (error: any) {
    console.error("❌ [API] Error saving training summary:", error)
    return NextResponse.json(
      {
        error: "Failed to save training summary",
        details: error.message,
      },
      { status: 500 }
    )
  }
}


