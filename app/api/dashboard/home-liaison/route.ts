import { type NextRequest, NextResponse } from "next/server"
import { getConnection, query } from "@refugehouse/shared-core/db"
import { format, addDays, startOfDay, endOfDay } from "date-fns"
import { requireClerkAuth } from "@refugehouse/shared-core/auth"
import { getMicroserviceCode, shouldUseRadiusApiClient } from "@/lib/microservice-config"
import { radiusApiClient } from "@refugehouse/radius-api-client"

export const dynamic = "force-dynamic"
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

    const microserviceCode = getMicroserviceCode()
    const useApiClient = shouldUseRadiusApiClient()

    let upcomingAppointments: any[]

    if (useApiClient) {
      // Use API client for appointments
      console.log(`✅ [DASHBOARD] Using API client for appointments (microservice: ${microserviceCode})`)
      
      const apiAppointments = await radiusApiClient.getAppointments({
        startDate: today.toISOString(),
        endDate: endDate.toISOString(),
      })

      // Filter appointments by user (match by user_id or clerk_user_id)
      upcomingAppointments = apiAppointments
        .filter((apt: any) => {
          const matchesAssigned = apt.assigned_to_user_id === userId || apt.assigned_to_user_id === clerkUserId
          const matchesCreated = apt.created_by_user_id === userId || apt.created_by_user_id === clerkUserId
          return matchesAssigned || matchesCreated
        })
        .map((apt: any) => ({
          appointment_id: apt.appointment_id,
          title: apt.title,
          home_name: apt.home_name,
          start_datetime: apt.start_datetime,
          end_datetime: apt.end_datetime,
          status: apt.status,
          priority: apt.priority,
          location_address: apt.location_address,
          assigned_to_user_id: apt.assigned_to_user_id,
          assigned_to_name: apt.assigned_to_name,
          created_by_user_id: apt.created_by_user_id,
          form_status: null, // Will be filled from visit forms
          visit_form_id: null, // Will be filled from visit forms
          assigned_to_email: userEmail, // We know this matches
          created_by_email: userEmail, // We know this matches
        }))

      // Get visit forms to match with appointments
      const visitForms = await radiusApiClient.getVisitForms({
        status: undefined, // Get all statuses
      })

      // Match visit forms to appointments
      const visitFormsByAppointmentId = new Map(
        visitForms.map((vf: any) => [vf.appointment_id, vf])
      )

      upcomingAppointments = upcomingAppointments.map((apt: any) => {
        const visitForm = visitFormsByAppointmentId.get(apt.appointment_id)
        if (visitForm) {
          apt.form_status = visitForm.status
          apt.visit_form_id = visitForm.visit_form_id
        }
        return apt
      })

      // Sort by start_datetime ASC
      upcomingAppointments.sort((a, b) => {
        const aDate = new Date(a.start_datetime).getTime()
        const bDate = new Date(b.start_datetime).getTime()
        return aDate - bDate
      })
    } else {
      // Direct database access for admin microservice
      console.log(`⚠️ [DASHBOARD] Using direct DB access for appointments (admin microservice)`)
      
      // Fetch upcoming appointments - filter by email address to handle multiple app_user records
      // Join with app_users to match by email instead of just user_id
      upcomingAppointments = await query(
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
        LEFT JOIN visit_forms vf ON a.appointment_id = vf.appointment_id
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
    }

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

    // Calculate stats from fetched appointments (works for both API client and direct DB)
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

