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

    // Cast decimal coordinates to float to ensure proper JavaScript conversion
    const homes = await query(
      `SELECT TOP 20 
        [HomeName], [Street], [City], [State], [Zip], [HomePhone], 
        [Xref], [CaseManager], [Unit], [Guid], [CaseManagerEmail], 
        [CaseManagerPhone], [CaregiverEmail], [LastSync], 
        CAST([Latitude] AS FLOAT) AS Latitude,
        CAST([Longitude] AS FLOAT) AS Longitude
       FROM SyncActiveHomes 
       ORDER BY HomeName;`,
    )

    console.log(`📍 Homes list query returned ${homes.length} records`)
    if (homes.length > 0) {
      console.log("Sample coordinates after CAST:", {
        HomeName: homes[0].HomeName,
        Latitude: homes[0].Latitude,
        LatitudeType: typeof homes[0].Latitude,
        Longitude: homes[0].Longitude,
        LongitudeType: typeof homes[0].Longitude,
      })
    }

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
