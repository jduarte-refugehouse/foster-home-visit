import { type NextRequest, NextResponse } from "next/server"
import { query } from "@refugehouse/shared-core/db"
import { format, addDays, startOfDay, endOfDay } from "date-fns"
import { requireClerkAuth } from "@refugehouse/shared-core/auth"
import { getMicroserviceCode, shouldUseRadiusApiClient, throwIfDirectDbNotAllowed } from "@/lib/microservice-config"
import { radiusApiClient } from "@refugehouse/radius-api-client"
import { addNoCacheHeaders, DYNAMIC_ROUTE_CONFIG } from "@/lib/api-cache-utils"

export const dynamic = DYNAMIC_ROUTE_CONFIG.dynamic
export const revalidate = DYNAMIC_ROUTE_CONFIG.revalidate
export const fetchCache = DYNAMIC_ROUTE_CONFIG.fetchCache
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

    // NO DB FALLBACK - must use API client
    if (!useApiClient) {
      throwIfDirectDbNotAllowed("dashboard/home-liaison endpoint")
    }

    // Use API client for dashboard data
    console.log(`✅ [DASHBOARD] Using API client for dashboard data (microservice: ${microserviceCode})`)
    
    const dashboardData = await radiusApiClient.getDashboardHomeLiaison(userEmail)
    const upcomingAppointments = dashboardData.upcomingAppointments || []
    const upcomingOnCall = dashboardData.upcomingOnCall || []
    
    // Use the stats and other data from API Hub
    const todayStart = startOfDay(new Date())
    const todayEnd = endOfDay(new Date())
    const weekEnd = endOfDay(addDays(today, 7))

    const todayAppointments = {
      count: dashboardData.stats?.todayCount || upcomingAppointments.filter((apt: any) => {
        const aptDate = new Date(apt.start_datetime)
        return aptDate >= todayStart && aptDate <= todayEnd
      }).length,
    }

    const weekAppointments = {
      count: dashboardData.stats?.weekCount || upcomingAppointments.filter((apt: any) => {
        const aptDate = new Date(apt.start_datetime)
        return aptDate >= todayStart && aptDate <= weekEnd
      }).length,
    }

    const pendingVisits = {
      count: dashboardData.stats?.pendingVisits || upcomingAppointments.filter((apt: any) => {
        const aptDate = new Date(apt.start_datetime)
        return apt.status === 'scheduled' && aptDate >= today
      }).length,
    }

    const currentOnCall = upcomingOnCall.filter(
      (schedule: any) => new Date() >= new Date(schedule.start_datetime) && new Date() <= new Date(schedule.end_datetime)
    )

    const response = NextResponse.json({
      success: true,
      data: {
        user: dashboardData.user || {
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
        upcomingAppointments: upcomingAppointments.slice(0, 10),
        upcomingOnCall: upcomingOnCall.slice(0, 5),
        currentOnCall: currentOnCall.length > 0 ? currentOnCall[0] : null,
      },
    })
    return addNoCacheHeaders(response)
  } catch (error) {
    console.error("❌ Error fetching Home Liaison dashboard data:", error)
    
    // Check if this is a direct DB access error
    if (error instanceof Error && error.message.includes("DIRECT DATABASE ACCESS NOT ALLOWED")) {
      return NextResponse.json(
        {
          success: false,
          error: "Configuration Error",
          details: error.message,
        },
        { status: 500 }
      )
    }
    
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
