import { type NextRequest, NextResponse } from "next/server"
import { getConnection, query } from "@/lib/db"
import { format, addDays, startOfDay, endOfDay } from "date-fns"
import { requireClerkAuth } from "@/lib/clerk-auth-helper"

export const runtime = "nodejs"

export async function GET(request: NextRequest) {
  try {
    // SAFE: Get Clerk user ID from headers (no middleware required)
    let clerkUserId: string
    let userEmail: string | null = null
    try {
      const auth = requireClerkAuth(request)
      clerkUserId = auth.clerkUserId
      userEmail = auth.email
    } catch (authError) {
      return NextResponse.json({ 
        error: "Unauthorized", 
        details: authError instanceof Error ? authError.message : "Missing authentication headers" 
      }, { status: 401 })
    }

    // Get email from auth headers (primary identifier)
    if (!userEmail) {
      return NextResponse.json({ 
        error: "Unauthorized", 
        details: "Missing email in authentication headers" 
      }, { status: 401 })
    }

    // Check for impersonation first
    const impersonatedUserId = request.cookies.get("impersonate_user_id")?.value
    
    // Get user info - prefer impersonated user if active, otherwise get any app_user with matching email
    // This handles cases where user has multiple app_user records with same email
    let appUser: { id: string; email: string; first_name: string; last_name: string }[]
    
    if (impersonatedUserId) {
      appUser = await query<{ id: string; email: string; first_name: string; last_name: string }>(
        `SELECT id, email, first_name, last_name FROM app_users WHERE id = @param0`,
        [impersonatedUserId]
      )
    } else {
      // Get any app_user record with matching email (handles multiple records)
      appUser = await query<{ id: string; email: string; first_name: string; last_name: string }>(
        `SELECT TOP 1 id, email, first_name, last_name FROM app_users WHERE email = @param0 ORDER BY created_at DESC`,
        [userEmail]
      )
    }

    if (appUser.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const user = appUser[0]
    const userId = user.id

    // Debug: Log user info
    console.log("🔍 [DASHBOARD] User lookup:", {
      clerkUserId,
      impersonatedUserId,
      appUserId: userId,
      userName: `${user.first_name} ${user.last_name}`,
      email: userEmail,
      appUserEmail: user.email,
      note: "Filtering by email to handle multiple app_user records",
    })

    // Date range: today and next 30 days
    const today = startOfDay(new Date())
    const endDate = endOfDay(addDays(today, 30))

    // Fetch upcoming appointments - filter by email address to handle multiple app_user records
    // Join with app_users to match by email instead of just user_id
    const upcomingAppointments = await query(
      `
      SELECT DISTINCT
        a.appointment_id,
        a.title,
        h.HomeName as home_name,
        a.start_datetime,
        a.end_datetime,
        a.status,
        a.priority,
        a.location_address,
        a.assigned_to_user_id,
        a.assigned_to_name,
        a.created_by_user_id,
        vf.status as form_status,
        vf.visit_form_id
      FROM appointments a
      LEFT JOIN visit_forms vf ON a.appointment_id = vf.appointment_id
      LEFT JOIN app_users au_assigned ON a.assigned_to_user_id = au_assigned.id
      LEFT JOIN app_users au_created ON a.created_by_user_id = au_created.id
      LEFT JOIN SyncActiveHomes h ON a.home_xref = h.Xref
      WHERE (au_assigned.email = @param0 OR au_created.email = @param0)
        AND a.start_datetime >= @param1
        AND a.start_datetime <= @param2
        AND a.is_deleted = 0
      ORDER BY a.start_datetime ASC
    `,
      [userEmail, today.toISOString(), endDate.toISOString()]
    )

    console.log("🔍 [DASHBOARD] Found appointments:", {
      count: upcomingAppointments.length,
      appointments: upcomingAppointments.map((a: any) => ({
        id: a.appointment_id,
        title: a.title,
        assigned_to_user_id: a.assigned_to_user_id,
        created_by_user_id: a.created_by_user_id,
        start_datetime: a.start_datetime,
      })),
    })

    // Fetch upcoming on-call assignments - filter by email (primary identifier)
    const upcomingOnCall = await query(
      `
      SELECT 
        ocs.id,
        ocs.start_datetime,
        ocs.end_datetime,
        ocs.on_call_type,
        ocs.on_call_category,
        ocs.duration_hours,
        ocs.user_id,
        ocs.user_email,
        ocs.is_currently_active,
        CASE 
          WHEN GETDATE() BETWEEN ocs.start_datetime AND ocs.end_datetime 
          THEN 1 
          ELSE 0 
        END as is_currently_active
      FROM on_call_schedule ocs
      LEFT JOIN app_users au ON ocs.user_id = au.id
      WHERE (ocs.user_email = @param0 OR au.email = @param0)
        AND ocs.end_datetime >= @param1
        AND ocs.is_active = 1
        AND ocs.is_deleted = 0
      ORDER BY ocs.start_datetime ASC
    `,
      [userEmail, today.toISOString()]
    )

    console.log("🔍 [DASHBOARD] Found on-call schedules:", {
      count: upcomingOnCall.length,
      schedules: upcomingOnCall.map((s: any) => ({
        id: s.id,
        user_id: s.user_id,
        user_email: s.user_email,
        start_datetime: s.start_datetime,
      })),
    })

    // Count today's appointments - filter by email
    const todayStart = startOfDay(new Date()).toISOString()
    const todayEnd = endOfDay(new Date()).toISOString()
    const todayAppointments = await query(
      `
      SELECT COUNT(DISTINCT a.appointment_id) as count
      FROM appointments a
      LEFT JOIN app_users au_assigned ON a.assigned_to_user_id = au_assigned.id
      LEFT JOIN app_users au_created ON a.created_by_user_id = au_created.id
      WHERE (au_assigned.email = @param0 OR au_created.email = @param0)
        AND a.start_datetime >= @param1
        AND a.start_datetime <= @param2
        AND a.is_deleted = 0
    `,
      [userEmail, todayStart, todayEnd]
    )

    // Count this week's appointments - filter by email
    const weekEnd = endOfDay(addDays(today, 7)).toISOString()
    const weekAppointments = await query(
      `
      SELECT COUNT(DISTINCT a.appointment_id) as count
      FROM appointments a
      LEFT JOIN app_users au_assigned ON a.assigned_to_user_id = au_assigned.id
      LEFT JOIN app_users au_created ON a.created_by_user_id = au_created.id
      WHERE (au_assigned.email = @param0 OR au_created.email = @param0)
        AND a.start_datetime >= @param1
        AND a.start_datetime <= @param2
        AND a.is_deleted = 0
    `,
      [userEmail, todayStart, weekEnd]
    )

    // Count pending visits - filter by email
    const pendingVisits = await query(
      `
      SELECT COUNT(DISTINCT a.appointment_id) as count
      FROM appointments a
      LEFT JOIN app_users au_assigned ON a.assigned_to_user_id = au_assigned.id
      LEFT JOIN app_users au_created ON a.created_by_user_id = au_created.id
      WHERE (au_assigned.email = @param0 OR au_created.email = @param0)
        AND a.status = 'scheduled'
        AND a.start_datetime >= @param1
        AND a.is_deleted = 0
    `,
      [userEmail, today.toISOString()]
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

