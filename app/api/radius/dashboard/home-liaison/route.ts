import { NextRequest, NextResponse } from "next/server"
import { validateApiKey } from "@/lib/api-auth"
import { query } from "@refugehouse/shared-core/db"
import { format, addDays, startOfDay, endOfDay } from "date-fns"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"
export const maxDuration = 60

/**
 * GET /api/radius/dashboard/home-liaison
 * 
 * Get dashboard data for home liaison users
 * Requires API key authentication via x-api-key header
 * 
 * Query Parameters:
 * - userEmail: User email (required)
 * 
 * Returns: Dashboard data with appointments, on-call schedules, and stats
 */
export async function GET(request: NextRequest) {
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

    // 2. Parse query parameters
    const { searchParams } = new URL(request.url)
    const userEmail = searchParams.get("userEmail")

    if (!userEmail) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required parameter: userEmail",
        },
        { status: 400 }
      )
    }

    // 3. Get user info
    const appUser = await query<{ id: string; email: string; first_name: string; last_name: string }>(
      `SELECT TOP 1 id, email, first_name, last_name FROM app_users WHERE email = @param0 ORDER BY created_at DESC`,
      [userEmail]
    )

    if (appUser.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "User not found",
        },
        { status: 404 }
      )
    }

    const user = appUser[0]
    const userId = user.id

    // 4. Date range: today and next 30 days
    const today = startOfDay(new Date())
    const endDate = endOfDay(addDays(today, 30))

    // 5. Fetch upcoming appointments
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
        vf.visit_form_id,
        au_assigned.email AS assigned_to_email,
        au_created.email AS created_by_email
      FROM appointments a
      LEFT JOIN visit_forms vf ON a.appointment_id = vf.appointment_id AND vf.is_deleted = 0
      LEFT JOIN app_users au_assigned ON 
        (TRY_CAST(a.assigned_to_user_id AS UNIQUEIDENTIFIER) = au_assigned.id 
         OR a.assigned_to_user_id = au_assigned.clerk_user_id)
      LEFT JOIN app_users au_created ON 
        (TRY_CAST(a.created_by_user_id AS UNIQUEIDENTIFIER) = au_created.id 
         OR a.created_by_user_id = au_created.clerk_user_id)
      LEFT JOIN SyncActiveHomes h ON a.home_xref = h.Xref
      WHERE (au_assigned.email = @param0 OR au_created.email = @param0)
        AND a.start_datetime >= @param1
        AND a.start_datetime <= @param2
        AND a.is_deleted = 0
      ORDER BY a.start_datetime ASC
    `,
      [userEmail, today.toISOString(), endDate.toISOString()]
    )

    // 6. Fetch upcoming on-call assignments
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

    // 7. Calculate stats
    const todayStart = startOfDay(new Date())
    const todayEnd = endOfDay(new Date())
    const weekEnd = endOfDay(addDays(today, 7))

    const todayAppointments = {
      count: upcomingAppointments.filter((apt: any) => {
        const aptDate = new Date(apt.start_datetime)
        return aptDate >= todayStart && aptDate <= todayEnd
      }).length,
    }

    const weekAppointments = {
      count: upcomingAppointments.filter((apt: any) => {
        const aptDate = new Date(apt.start_datetime)
        return aptDate >= todayStart && aptDate <= weekEnd
      }).length,
    }

    const pendingVisits = {
      count: upcomingAppointments.filter((apt: any) => {
        const aptDate = new Date(apt.start_datetime)
        return apt.status === 'scheduled' && aptDate >= today
      }).length,
    }

    // 8. Get current on-call status
    const currentOnCall = upcomingOnCall.filter(
      (schedule: any) => new Date() >= new Date(schedule.start_datetime) && new Date() <= new Date(schedule.end_datetime)
    )

    const duration = Date.now() - startTime

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: user.id,
          name: `${user.first_name} ${user.last_name}`,
          email: user.email,
        },
        stats: {
          todayCount: todayAppointments.count,
          weekCount: weekAppointments.count,
          pendingVisits: pendingVisits.count,
          upcomingOnCallCount: upcomingOnCall.length,
          isCurrentlyOnCall: currentOnCall.length > 0,
        },
        upcomingAppointments: upcomingAppointments.slice(0, 10), // Next 10 appointments
        upcomingOnCall: upcomingOnCall.slice(0, 5), // Next 5 on-call assignments
        currentOnCall: currentOnCall.length > 0 ? currentOnCall[0] : null,
      },
      timestamp: new Date().toISOString(),
      duration_ms: duration,
    })
  } catch (error) {
    const duration = Date.now() - startTime
    console.error("❌ [RADIUS-API] Error in dashboard/home-liaison:", error)

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

