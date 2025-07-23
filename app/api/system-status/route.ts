import { NextResponse } from "next/server"
import { testConnection, query } from "@/lib/db"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    console.log("🔍 Testing system status...")

    // Test database connection
    const dbTest = await testConnection()

    const systemStats = {
      activeUsers: 0,
      totalRoles: 0,
      totalPermissions: 0,
    }

    if (dbTest.success) {
      try {
        // Get active users count
        const userCount = await query(`
          SELECT COUNT(*) as count 
          FROM app_users 
          WHERE is_active = 1
        `)
        systemStats.activeUsers = userCount[0]?.count || 0

        // Get roles count for home-visits
        const roleCount = await query(`
          SELECT COUNT(DISTINCT role_name) as count 
          FROM user_roles 
          WHERE microservice_id = '1A5F93AC-9286-48FD-849D-BB132E5031C7' 
            AND is_active = 1
        `)
        systemStats.totalRoles = roleCount[0]?.count || 0

        // Get permissions count for home-visits
        const permissionCount = await query(`
          SELECT COUNT(*) as count 
          FROM permissions 
          WHERE microservice_id = '1A5F93AC-9286-48FD-849D-BB132E5031C7'
        `)
        systemStats.totalPermissions = permissionCount[0]?.count || 0

        console.log("✅ System stats:", systemStats)
      } catch (statsError) {
        console.error("❌ Error getting system stats:", statsError)
      }
    }

    const response = {
      database: dbTest.success ? "connected" : "error",
      environment: process.env.NODE_ENV || "development",
      version: "1.0.0",
      uptime: "Active",
      lastCheck: new Date().toISOString(),
      ...systemStats,
      dbMessage: dbTest.message,
      passwordSource: dbTest.passwordSource,
    }

    console.log("✅ System status response:", response)

    return NextResponse.json(response)
  } catch (error) {
    console.error("❌ System status error:", error)
    return NextResponse.json({
      database: "error",
      environment: "unknown",
      version: "1.0.0",
      uptime: "Unknown",
      lastCheck: new Date().toISOString(),
      activeUsers: 0,
      totalRoles: 0,
      totalPermissions: 0,
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }
}
