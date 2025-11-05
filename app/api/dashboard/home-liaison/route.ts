import { type NextRequest, NextResponse } from "next/server"
import { getConnection, query } from "@/lib/db"
import { format, addDays, startOfDay, endOfDay } from "date-fns"
import { requireClerkAuth } from "@/lib/clerk-auth-helper"

export const runtime = "nodejs"

export async function GET(request: NextRequest) {
  try {
    // SAFE: Get Clerk user ID from headers (no middleware required)
    let clerkUserId: string
    try {
      const auth = requireClerkAuth(request)
      clerkUserId = auth.clerkUserId
    } catch (authError) {
      return NextResponse.json({ 
        error: "Unauthorized", 
        details: authError instanceof Error ? authError.message : "Missing authentication headers" 
      }, { status: 401 })
    }

    // Check for impersonation first
    const impersonatedUserId = request.cookies.get("impersonate_user_id")?.value
    
    // Get the app user ID (impersonated if active, otherwise real user)
    const appUser = await query<{ id: string; email: string; first_name: string; last_name: string }>(
      impersonatedUserId
        ? `SELECT id, email, first_name, last_name FROM app_users WHERE id = @param0`
        : `SELECT id, email, first_name, last_name FROM app_users WHERE clerk_user_id = @param0`,
      [impersonatedUserId || clerkUserId]
    )

    if (appUser.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const user = appUser[0]
    const userId = user.id

    // Date range: today and next 30 days
    const today = startOfDay(new Date())
    const endDate = endOfDay(addDays(today, 30))

    // Fetch upcoming appointments assigned to this user
    const upcomingAppointments = await query(
      `
      SELECT 
        a.appointment_id,
        a.title,
        a.home_name,
        a.start_datetime,
        a.end_datetime,
        a.status,
        a.priority,
        a.location_address,
        a.assigned_to_user_id,
        a.assigned_to_name,
        vf.status as form_status,
        vf.visit_form_id
      FROM appointments a
      LEFT JOIN visit_forms vf ON a.appointment_id = vf.appointment_id
      WHERE a.assigned_to_user_id = @param0
        AND a.start_datetime >= @param1
        AND a.start_datetime <= @param2
        AND a.is_deleted = 0
      ORDER BY a.start_datetime ASC
    `,
      [userId, today.toISOString(), endDate.toISOString()]
    )

    // Fetch upcoming on-call assignments for this user
    const upcomingOnCall = await query(
      `
      SELECT 
        ocs.id,
        ocs.start_datetime,
        ocs.end_datetime,
        ocs.on_call_type,
        ocs.on_call_category,
        ocs.duration_hours,
        ocs.is_currently_active,
        CASE 
          WHEN GETDATE() BETWEEN ocs.start_datetime AND ocs.end_datetime 
          THEN 1 
          ELSE 0 
        END as is_currently_active
      FROM on_call_schedule ocs
      WHERE ocs.user_id = @param0
        AND ocs.end_datetime >= @param1
        AND ocs.is_active = 1
        AND ocs.is_deleted = 0
      ORDER BY ocs.start_datetime ASC
    `,
      [userId, today.toISOString()]
    )

    // Count today's appointments
    const todayStart = startOfDay(new Date()).toISOString()
    const todayEnd = endOfDay(new Date()).toISOString()
    const todayAppointments = await query(
      `
      SELECT COUNT(*) as count
      FROM appointments
      WHERE assigned_to_user_id = @param0
        AND start_datetime >= @param1
        AND start_datetime <= @param2
        AND is_deleted = 0
    `,
      [userId, todayStart, todayEnd]
    )

    // Count this week's appointments
    const weekEnd = endOfDay(addDays(today, 7)).toISOString()
    const weekAppointments = await query(
      `
      SELECT COUNT(*) as count
      FROM appointments
      WHERE assigned_to_user_id = @param0
        AND start_datetime >= @param1
        AND start_datetime <= @param2
        AND is_deleted = 0
    `,
      [userId, todayStart, weekEnd]
    )

    // Count pending visits (scheduled but not started)
    const pendingVisits = await query(
      `
      SELECT COUNT(*) as count
      FROM appointments
      WHERE assigned_to_user_id = @param0
        AND status = 'scheduled'
        AND start_datetime >= @param1
        AND is_deleted = 0
    `,
      [userId, today.toISOString()]
    )

    // Get current on-call status
    const currentOnCall = upcomingOnCall.filter(
      (schedule: any) => new Date() >= new Date(schedule.start_datetime) && new Date() <= new Date(schedule.end_datetime)
    )

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: user.id,
          name: `${user.first_name} ${user.last_name}`,
          email: user.email,
        },
        stats: {
          todayCount: todayAppointments[0]?.count || 0,
          weekCount: weekAppointments[0]?.count || 0,
          pendingVisits: pendingVisits[0]?.count || 0,
          upcomingOnCallCount: upcomingOnCall.length,
          isCurrentlyOnCall: currentOnCall.length > 0,
        },
        upcomingAppointments: upcomingAppointments.slice(0, 10), // Next 10 appointments
        upcomingOnCall: upcomingOnCall.slice(0, 5), // Next 5 on-call assignments
        currentOnCall: currentOnCall.length > 0 ? currentOnCall[0] : null,
      },
    })
  } catch (error) {
    console.error("❌ Error fetching Home Liaison dashboard data:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch dashboard data",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}

