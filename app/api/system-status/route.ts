import { NextResponse } from "next/server"
import { getDbConnection } from "@/lib/db"

export async function GET() {
  try {
    // Test database connection
    let databaseStatus = "connected"
    let uptime = "Unknown"

    try {
      const pool = await getDbConnection()
      const result = await pool.request().query("SELECT 1 as test")
      if (result.recordset.length > 0) {
        databaseStatus = "connected"
      }
    } catch (error) {
      console.error("Database connection test failed:", error)
      databaseStatus = "error"
    }

    // Calculate uptime (simplified - in production you'd track actual start time)
    const startTime = new Date()
    startTime.setHours(startTime.getHours() - 24) // Simulate 24 hours uptime
    const uptimeMs = Date.now() - startTime.getTime()
    const uptimeHours = Math.floor(uptimeMs / (1000 * 60 * 60))
    const uptimeMinutes = Math.floor((uptimeMs % (1000 * 60 * 60)) / (1000 * 60))
    uptime = `${uptimeHours}h ${uptimeMinutes}m`

    return NextResponse.json({
      database: databaseStatus,
      environment: process.env.NODE_ENV || "development",
      version: "1.0.0",
      uptime: uptime,
      lastCheck: new Date().toISOString(),
      timestamp: Date.now(),
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
