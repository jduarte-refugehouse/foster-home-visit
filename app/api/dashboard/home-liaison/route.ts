import { type NextRequest, NextResponse } from "next/server"
import { addDays, startOfDay, endOfDay } from "date-fns"
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

    const microserviceCode = getMicroserviceCode()
    const useApiClient = shouldUseRadiusApiClient()

    // NO DB FALLBACK - must use API client
    if (!useApiClient) {
      throwIfDirectDbNotAllowed("dashboard/home-liaison endpoint")
    }

    // Use API client for dashboard data (includes user lookup)
    console.log(`✅ [DASHBOARD] Using API client for dashboard data (microservice: ${microserviceCode}, email: ${userEmail})`)
    
    const dashboardData = await radiusApiClient.getDashboardHomeLiaison(userEmail)
    
    // Check if user was found
    if (!dashboardData.user) {
      return NextResponse.json({ 
        error: "User not found",
        details: "User not found in system database. Please contact an administrator."
      }, { status: 404 })
    }
    
    const upcomingAppointments = dashboardData.upcomingAppointments || []
    const upcomingOnCall = dashboardData.upcomingOnCall || []
    
    // Use the stats and other data from API Hub
    const today = startOfDay(new Date())
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
        user: dashboardData.user,
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
    console.error("❌ Error details:", {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : typeof error,
    })
    
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
    
    // Check if this is an API client timeout or connection error
    if (error instanceof Error && (error.message.includes("timed out") || error.message.includes("fetch failed"))) {
      return NextResponse.json(
        {
          success: false,
          error: "API Hub Connection Error",
          details: "Failed to connect to admin service. Please check your network connection and try again.",
          originalError: error.message,
        },
        { status: 503 }
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
