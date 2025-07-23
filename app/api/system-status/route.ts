import { NextResponse } from "next/server"
import { query } from "@/lib/db"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    console.log("🔍 Fetching system status...")

    // Test database connection and get counts
    const userCount = await query("SELECT COUNT(*) as count FROM app_users")
    const activeUserCount = await query("SELECT COUNT(*) as count FROM app_users WHERE is_active = 1")
    const roleCount = await query("SELECT COUNT(*) as count FROM user_roles")
    const permissionCount = await query("SELECT COUNT(*) as count FROM permissions")
    const appCount = await query("SELECT COUNT(*) as count FROM microservice_apps")

    console.log("✅ System status counts:", {
      users: userCount[0]?.count || 0,
      activeUsers: activeUserCount[0]?.count || 0,
      roles: roleCount[0]?.count || 0,
      permissions: permissionCount[0]?.count || 0,
      apps: appCount[0]?.count || 0,
    })

    return NextResponse.json({
      database: "connected",
      environment: "production",
      version: "1.0.0",
      uptime: "Unknown",
      totalUsers: userCount[0]?.count || 0,
      activeUsers: activeUserCount[0]?.count || 0,
      totalRoles: roleCount[0]?.count || 0,
      totalPermissions: permissionCount[0]?.count || 0,
      totalApps: appCount[0]?.count || 0,
      lastCheck: new Date().toISOString(),
    })
  } catch (error) {
    console.error("❌ Error fetching system status:", error)
    return NextResponse.json(
      {
        database: "error",
        environment: "production",
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
