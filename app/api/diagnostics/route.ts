import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { getDbConnection } from "@/lib/db"

export async function GET() {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const diagnostics = {
      timestamp: new Date().toISOString(),
      database: { status: "unknown", message: "", responseTime: 0 },
      authentication: { status: "connected", userId },
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        uptime: process.uptime(),
      },
    }

    // Test database connection
    try {
      const startTime = Date.now()
      const pool = await getDbConnection()
      await pool.request().query("SELECT 1 as test")
      const endTime = Date.now()

      diagnostics.database = {
        status: "connected",
        message: "Database connection successful",
        responseTime: endTime - startTime,
      }
    } catch (dbError) {
      diagnostics.database = {
        status: "error",
        message: dbError instanceof Error ? dbError.message : "Database connection failed",
        responseTime: 0,
      }
    }

    return NextResponse.json(diagnostics)
  } catch (error) {
    console.error("Diagnostics error:", error)
    return NextResponse.json({ error: "Failed to run diagnostics" }, { status: 500 })
  }
}
