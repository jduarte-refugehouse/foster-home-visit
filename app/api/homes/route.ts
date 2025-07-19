import { NextResponse } from "next/server"
import { query, healthCheck } from "@/lib/db"

// Force Node.js runtime (not Edge)
export const runtime = "nodejs"

export async function GET() {
  try {
    console.log("=== Fetching homes data ===")

    // Quick health check first
    const isHealthy = await healthCheck()
    if (!isHealthy) {
      return NextResponse.json(
        {
          success: false,
          error: "Database connection unhealthy",
          message: "Unable to establish database connection",
        },
        { status: 503 },
      )
    }

    console.log("Health check passed, querying SyncActiveHomes...")

    // Query the SyncActiveHomes table
    const homes = await query("SELECT TOP 20 * FROM dbo.SyncActiveHomes ORDER BY HomeID")

    console.log(`Successfully retrieved ${homes.length} homes`)

    return NextResponse.json({
      success: true,
      homes,
      count: homes.length,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("=== Homes query failed ===", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch homes",
        message: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
