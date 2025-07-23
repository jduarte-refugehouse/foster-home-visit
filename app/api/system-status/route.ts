import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { query } from "@/lib/db"

export async function GET() {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Test database connection
    let databaseStatus = "connected"
    let additionalInfo = {}

    try {
      // Test basic connection
      const testResult = await query("SELECT 1 as test")

      // Get some basic stats
      const userCount = await query(`
        SELECT COUNT(*) as count FROM app_users WHERE is_active = 1
      `)

      const permissionCount = await query(`
        SELECT COUNT(*) as count FROM permissions p
        INNER JOIN microservice_apps ma ON p.microservice_id = ma.id
        WHERE ma.app_code = 'home-visits'
      `)

      const roleCount = await query(`
        SELECT COUNT(DISTINCT role_name) as count FROM user_roles ur
        INNER JOIN microservice_apps ma ON ur.microservice_id = ma.id
        WHERE ma.app_code = 'home-visits' AND ur.is_active = 1
      `)

      additionalInfo = {
        activeUsers: userCount[0]?.count || 0,
        totalPermissions: permissionCount[0]?.count || 0,
        totalRoles: roleCount[0]?.count || 0,
      }

      if (testResult.length > 0) {
        databaseStatus = "connected"
      }
    } catch (error) {
      console.error("Database connection test failed:", error)
      databaseStatus = "error"
    }

    // Calculate uptime (simplified)
    const uptimeMs = process.uptime() * 1000
    const uptimeHours = Math.floor(uptimeMs / (1000 * 60 * 60))
    const uptimeMinutes = Math.floor((uptimeMs % (1000 * 60 * 60)) / (1000 * 60))
    const uptime = `${uptimeHours}h ${uptimeMinutes}m`

    return NextResponse.json({
      database: databaseStatus,
      environment: process.env.NODE_ENV || "development",
      version: "1.0.0",
      uptime: uptime,
      lastCheck: new Date().toISOString(),
      timestamp: Date.now(),
      ...additionalInfo,
    })
  } catch (error) {
    console.error("System status check failed:", error)
    return NextResponse.json(
      {
        database: "error",
        environment: "unknown",
        version: "1.0.0",
        uptime: "unknown",
        lastCheck: new Date().toISOString(),
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
