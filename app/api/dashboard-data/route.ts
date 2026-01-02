import { NextResponse } from "next/server"
import { getHomeStats, fetchHomesList, getUniqueCaseManagers } from "@/lib/db-extensions"
import { addNoCacheHeaders, DYNAMIC_ROUTE_CONFIG } from "@/lib/api-cache-utils"

export const dynamic = DYNAMIC_ROUTE_CONFIG.dynamic
export const revalidate = DYNAMIC_ROUTE_CONFIG.revalidate
export const fetchCache = DYNAMIC_ROUTE_CONFIG.fetchCache
export const runtime = "nodejs"

export async function GET() {
  console.log("📊 [API] Dashboard data endpoint called")

  try {
    // Fetch all the dashboard data
    const [stats, allHomes, caseManagers] = await Promise.all([
      getHomeStats(),
      fetchHomesList(),
      getUniqueCaseManagers(),
    ])

    // Calculate additional metrics
    const coordinateCompleteness = stats.total > 0 ? Math.round((stats.withCoordinates / stats.total) * 100) : 0

    // Calculate case manager workload
    const caseManagerWorkload = Object.entries(stats.byCaseManager)
      .map(([manager, count]) => ({
        manager: manager === "~unassigned~" ? "Unassigned" : manager,
        homeCount: count,
        isUnassigned: manager === "~unassigned~",
      }))
      .sort((a, b) => b.homeCount - a.homeCount)

    // Get recent activity (mock for now since we don't have activity tracking)
    const recentActivity = [
      {
        action: "Database sync completed",
        timestamp: new Date().toISOString(),
        type: "system",
      },
      {
        action: `${stats.total} homes loaded`,
        timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
        type: "data",
      },
    ]

    const dashboardData = {
      overview: {
        totalHomes: stats.total,
        mappedHomes: stats.withCoordinates,
        coordinateCompleteness,
        activeCaseManagers: caseManagers.length,
        serviceUnits: Object.keys(stats.byUnit).length,
      },
      distribution: {
        byUnit: stats.byUnit,
        byCaseManager: stats.byCaseManager,
      },
      caseManagerWorkload,
      recentActivity,
      lastUpdated: new Date().toISOString(),
    }

    console.log("✅ [API] Dashboard data compiled successfully")
    const response = NextResponse.json({
      success: true,
      data: dashboardData,
    })
    return addNoCacheHeaders(response)
  } catch (error) {
    console.error("❌ [API] Error fetching dashboard data:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch dashboard data",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
