import { NextResponse } from "next/server"
import { query, testConnection } from "@/lib/db"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    console.log("🔍 Fetching system status...")

    // Test database connection
    const connectionTest = await testConnection()

    let totalUsers = 0
    let activeUsers = 0
    let totalRoles = 0
    let totalPermissions = 0
    let totalApps = 0

    if (connectionTest.success) {
      try {
        // Get user counts
        const userCounts = await query(`
          SELECT 
            COUNT(*) as total_users,
            COUNT(CASE WHEN is_active = 1 THEN 1 END) as active_users
          FROM app_users
        `)

        if (userCounts.length > 0) {
          totalUsers = userCounts[0].total_users || 0
          activeUsers = userCounts[0].active_users || 0
        }

        // Get role counts
        const roleCounts = await query(`
          SELECT COUNT(*) as total_roles
          FROM user_roles
        `)

        if (roleCounts.length > 0) {
          totalRoles = roleCounts[0].total_roles || 0
        }

        // Get permission counts
        const permissionCounts = await query(`
          SELECT COUNT(*) as total_permissions
          FROM permissions
        `)

        if (permissionCounts.length > 0) {
          totalPermissions = permissionCounts[0].total_permissions || 0
        }

        // Get app counts
        const appCounts = await query(`
          SELECT COUNT(*) as total_apps
          FROM microservice_apps
        `)

        if (appCounts.length > 0) {
          totalApps = appCounts[0].total_apps || 0
        }

        console.log("✅ System status counts:", {
          totalUsers,
          activeUsers,
          totalRoles,
          totalPermissions,
          totalApps,
        })
      } catch (countError) {
        console.error("❌ Error getting counts:", countError)
      }
    }

    const statusData = {
      database: connectionTest.success ? "connected" : "error",
      environment: process.env.NODE_ENV || "development",
      version: "1.0.0",
      uptime: process.uptime ? `${Math.floor(process.uptime())} seconds` : "Unknown",
      totalUsers,
      activeUsers,
      totalRoles,
      totalPermissions,
      totalApps,
      lastCheck: new Date().toISOString(),
      error: connectionTest.success ? undefined : connectionTest.message,
    }

    console.log("✅ Final system status:", statusData)

    return NextResponse.json(statusData)
  } catch (error) {
    console.error("❌ Error in system status:", error)
    return NextResponse.json(
      {
        database: "error",
        environment: process.env.NODE_ENV || "development",
        version: "1.0.0",
        uptime: "Unknown",
        totalUsers: 0,
        activeUsers: 0,
        totalRoles: 0,
        totalPermissions: 0,
        totalApps: 0,
        lastCheck: new Date().toISOString(),
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
