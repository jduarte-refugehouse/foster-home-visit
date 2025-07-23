import { NextResponse } from "next/server"
import { query } from "@/lib/db"
import { currentUser } from "@clerk/nextjs/server"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    // Get current user identity from Clerk (identity only, not authorization)
    const clerkUser = await currentUser()
    if (!clerkUser) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    // Check authorization using our own database system
    const appUser = await query("SELECT * FROM app_users WHERE clerk_user_id = @param0 AND is_active = 1", [
      clerkUser.id,
    ])

    if (appUser.length === 0) {
      return NextResponse.json({ error: "User not found in system" }, { status: 403 })
    }

    // Check if user has system admin permissions in our database
    const isSystemAdmin = appUser[0].core_role === "system_admin" || appUser[0].email === "jduarte@refugehouse.org"

    if (!isSystemAdmin) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    console.log("🔍 Fetching system status...")

    // Get database statistics
    const userCount = await query("SELECT COUNT(*) as count FROM app_users")
    const activeUserCount = await query("SELECT COUNT(*) as count FROM app_users WHERE is_active = 1")
    const roleCount = await query("SELECT COUNT(DISTINCT role_name) as count FROM user_roles")
    const permissionCount = await query("SELECT COUNT(*) as count FROM permissions")
    const appCount = await query("SELECT COUNT(*) as count FROM microservice_apps")

    const systemStatus = {
      database: "connected",
      environment: process.env.NODE_ENV || "development",
      version: "1.0.0",
      uptime: process.uptime ? `${Math.floor(process.uptime() / 60)} minutes` : "Unknown",
      totalUsers: userCount[0]?.count || 0,
      activeUsers: activeUserCount[0]?.count || 0,
      totalRoles: roleCount[0]?.count || 0,
      totalPermissions: permissionCount[0]?.count || 0,
      totalApps: appCount[0]?.count || 0,
      lastCheck: new Date().toISOString(),
    }

    console.log("✅ System status:", systemStatus)

    return NextResponse.json(systemStatus)
  } catch (error) {
    console.error("❌ Error fetching system status:", error)
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
