import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

// GET - Find the next appointment for the same staff member on the same day
export async function GET(request: NextRequest, { params }: { params: { appointmentId: string } }) {
  try {
    const { appointmentId } = params

    console.log(`🔍 [API] Finding next appointment for: ${appointmentId}`)

    // First, get the current appointment details
    const currentAppointment = await query(
      `SELECT assigned_to_user_id, start_datetime, status
       FROM appointments
       WHERE appointment_id = @param0 AND is_deleted = 0`,
      [appointmentId],
    )

    if (currentAppointment.length === 0) {
      return NextResponse.json({ error: "Appointment not found" }, { status: 404 })
    }

    const current = currentAppointment[0]
    const currentDate = new Date(current.start_datetime)
    const startOfDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate())
    const endOfDay = new Date(startOfDay)
    endOfDay.setDate(endOfDay.getDate() + 1)

    // Find the next appointment for the same staff member on the same day
    // that starts after the current appointment's start time
    const nextAppointments = await query(
      `SELECT 
        appointment_id,
        title,
        start_datetime,
        location_address,
        home_xref,
        h.HomeName as home_name
       FROM appointments a
       LEFT JOIN SyncActiveHomes h ON a.home_xref = h.Xref
       WHERE a.assigned_to_user_id = @param0
         AND a.start_datetime >= @param1
         AND a.start_datetime < @param2
         AND a.start_datetime > @param3
         AND a.status != 'cancelled'
         AND a.is_deleted = 0
       ORDER BY a.start_datetime ASC
       OFFSET 0 ROWS FETCH NEXT 1 ROWS ONLY`,
      [
        current.assigned_to_user_id,
        startOfDay,
        endOfDay,
        current.start_datetime,
      ],
    )

    if (nextAppointments.length === 0) {
      return NextResponse.json({
        success: true,
        hasNext: false,
        nextAppointment: null,
      })
    }

    const next = nextAppointments[0]
    console.log(`✅ [API] Found next appointment: ${next.appointment_id}`)

    return NextResponse.json({
      success: true,
      hasNext: true,
      nextAppointment: {
        appointmentId: next.appointment_id,
        title: next.title,
        startDateTime: next.start_datetime,
        locationAddress: next.location_address,
        homeName: next.home_name,
      },
    })
  } catch (error) {
    console.error("❌ [API] Error finding next appointment:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to find next appointment",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

