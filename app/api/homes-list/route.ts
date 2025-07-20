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
        CAST([Latitude] AS VARCHAR(20)) AS LatString,
        CAST([Longitude] AS VARCHAR(20)) AS LonString,
        CAST([Latitude] AS FLOAT) AS Latitude,
        CAST([Longitude] AS FLOAT) AS Longitude
       FROM SyncActiveHomes 
       ORDER BY HomeName;`,
    )

    console.log(`📍 Homes list query returned ${homes.length} records`)
    if (homes.length > 0) {
      console.log("Sample coordinates after CAST:", {
        HomeName: homes[0].HomeName,
        LatString: homes[0].LatString,
        LonString: homes[0].LonString,
        Latitude: homes[0].Latitude,
        LatitudeType: typeof homes[0].Latitude,
        Longitude: homes[0].Longitude,
        LongitudeType: typeof homes[0].Longitude,
      })
    }

    // Process the homes to ensure coordinates are numbers
    const processedHomes = homes.map((home) => ({
      ...home,
      Latitude: typeof home.Latitude === "number" ? home.Latitude : Number.parseFloat(home.LatString || "0"),
      Longitude: typeof home.Longitude === "number" ? home.Longitude : Number.parseFloat(home.LonString || "0"),
    }))

    return NextResponse.json({
      success: true,
      homes: processedHomes,
      count: processedHomes.length,
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
