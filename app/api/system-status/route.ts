import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { query } from "@/lib/db"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("🔍 Testing system status and getting ALL counts...")

    let databaseStatus = "connected"
    const systemStats = {
      totalUsers: 0,
      activeUsers: 0,
      totalRoles: 0,
      totalPermissions: 0,
      totalApps: 0,
    }

    try {
      // Test basic connection
      const testResult = await query("SELECT 1 as test")
      console.log("✅ Database connection test passed")

      // Get ALL users count
      const userCount = await query(`SELECT COUNT(*) as count FROM app_users`)
      systemStats.totalUsers = userCount[0]?.count || 0

      // Get active users count
      const activeUserCount = await query(`SELECT COUNT(*) as count FROM app_users WHERE is_active = 1`)
      systemStats.activeUsers = activeUserCount[0]?.count || 0

      // Get ALL roles count
      const roleCount = await query(`SELECT COUNT(DISTINCT role_name) as count FROM user_roles`)
      systemStats.totalRoles = roleCount[0]?.count || 0

      // Get ALL permissions count
      const permissionCount = await query(`SELECT COUNT(*) as count FROM permissions`)
      systemStats.totalPermissions = permissionCount[0]?.count || 0

      // Get ALL apps count
      const appCount = await query(`SELECT COUNT(*) as count FROM microservice_apps`)
      systemStats.totalApps = appCount[0]?.count || 0

      console.log("✅ System stats:", systemStats)
    } catch (error) {
      console.error("❌ Database connection test failed:", error)
      databaseStatus = "error"
    }

    const response = {
      database: databaseStatus,
      environment: process.env.NODE_ENV || "development",
      version: "1.0.0",
      uptime: "Active",
      lastCheck: new Date().toISOString(),
      ...systemStats,
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
      totalUsers: 0,
      activeUsers: 0,
      totalRoles: 0,
      totalPermissions: 0,
      totalApps: 0,
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }
}
