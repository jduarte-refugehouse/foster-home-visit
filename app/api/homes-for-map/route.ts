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
          error: "Database connection unhealthy",
        },
        { status: 503 },
      )
    }

    // Fetch homes with valid coordinates using the exact column structure provided
    const homes = await query(
      `SELECT [HomeName], [Street], [City], [State], [Zip], [HomePhone], 
              [Xref], [CaseManager], [Unit], [Guid], [CaseManagerEmail], 
              [CaseManagerPhone], [CaregiverEmail], [LastSync], [Latitude], [Longitude]
       FROM dbo.SyncActiveHomes 
       WHERE [Latitude] IS NOT NULL AND [Longitude] IS NOT NULL
       ORDER BY [Unit], [HomeName]`,
    )

    return NextResponse.json({
      success: true,
      homes,
      count: homes.length,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("=== Homes for map query failed ===", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch homes for map",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
