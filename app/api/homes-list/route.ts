import { NextResponse } from "next/server"
import { query, healthCheck } from "@/lib/db"

export const runtime = "nodejs"

export async function GET() {
  try {
    const isHealthy = await healthCheck()
    if (!isHealthy) {
      return NextResponse.json(
        {
          success: false,
          error: "Database connection unhealthy.",
          message: "The database health check failed. Please check the connection details and firewall rules.",
        },
        { status: 503 },
      )
    }

    // Using the exact column list provided by the user
    const homes = await query(
      `SELECT TOP 20 
        [HomeName], [Street], [City], [State], [Zip], [HomePhone], 
        [Xref], [CaseManager], [Unit], [Guid], [CaseManagerEmail], 
        [CaseManagerPhone], [CaregiverEmail], [LastSync] 
       FROM dbo.SyncActiveHomes 
       ORDER BY HomeName;`,
    )

    return NextResponse.json({
      success: true,
      homes,
      count: homes.length,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("=== Homes list query failed ===", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to execute the database query.",
        message: error instanceof Error ? error.message : "An unknown error occurred during the query.",
      },
      { status: 500 },
    )
  }
}
