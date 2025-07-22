import { NextResponse } from "next/server"
import { getHomeStats, getUniqueCaseManagers } from "@/lib/db-extensions"

export async function GET() {
  try {
    console.log("📊 [Dashboard] Fetching real dashboard data...")

    // Get homes statistics
    const homeStats = await getHomeStats()

    // Get case managers for team metrics
    const caseManagers = await getUniqueCaseManagers()

    // Calculate some basic metrics
    const totalHomes = homeStats.total
    const homesWithCoordinates = homeStats.withCoordinates
    const coordinateCompleteness = totalHomes > 0 ? Math.round((homesWithCoordinates / totalHomes) * 100) : 0

    // Unit distribution
    const unitStats = homeStats.byUnit
    const totalUnits = Object.keys(unitStats).length

    // Case manager distribution
    const caseManagerStats = homeStats.byCaseManager
    const totalCaseManagers = caseManagers.length

    // Calculate average homes per case manager
    const avgHomesPerManager = totalCaseManagers > 0 ? Math.round(totalHomes / totalCaseManagers) : 0

    const dashboardData = {
      // Core metrics
      totalHomes,
      homesWithCoordinates,
      coordinateCompleteness,
      totalUnits,
      totalCaseManagers,
      avgHomesPerManager,

      // Distribution data
      unitDistribution: unitStats,
      caseManagerDistribution: caseManagerStats,

      // Recent activity (simulated for now)
      recentActivity: [
        {
          type: "data_sync",
          message: `${totalHomes} homes synchronized from database`,
          timestamp: new Date().toISOString(),
          status: "completed",
        },
        {
          type: "coordinate_update",
          message: `${homesWithCoordinates} homes have valid coordinates (${coordinateCompleteness}%)`,
          timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 min ago
          status: "info",
        },
        {
          type: "case_manager_assignment",
          message: `${totalCaseManagers} case managers managing homes`,
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
          status: "info",
        },
      ],

      // System health
      systemHealth: {
        databaseConnection: true,
        dataFreshness: "Current",
        lastSync: new Date().toISOString(),
      },
    }

    console.log("✅ [Dashboard] Dashboard data compiled successfully")
    return NextResponse.json(dashboardData)
  } catch (error) {
    console.error("❌ [Dashboard] Error fetching dashboard data:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch dashboard data",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
