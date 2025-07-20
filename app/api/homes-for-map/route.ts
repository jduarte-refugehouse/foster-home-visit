import { NextResponse } from "next/server"
import { query, healthCheck } from "@/lib/db"

export const runtime = "nodejs"

export async function GET() {
  try {
    console.log("=== 🗺️ Fetching homes for map ===")

    const isHealthy = await healthCheck()
    if (!isHealthy) {
      console.log("❌ Database health check failed")
      return NextResponse.json(
        {
          success: false,
          error: "Database connection unhealthy",
        },
        { status: 503 },
      )
    }

    console.log("✅ Database health check passed")

    // Cast decimal coordinates to float and filter for valid coordinates
    const homes = await query(
      `SELECT [HomeName], [Street], [City], [State], [Zip], [HomePhone], 
          [Xref], [CaseManager], [Unit], [Guid], [CaseManagerEmail], 
          [CaseManagerPhone], [CaregiverEmail], [LastSync], 
          CAST([Latitude] AS FLOAT) AS Latitude,
          CAST([Longitude] AS FLOAT) AS Longitude
   FROM SyncActiveHomes 
   WHERE [Latitude] IS NOT NULL 
     AND [Longitude] IS NOT NULL
     AND [Latitude] != 0 
     AND [Longitude] != 0
   ORDER BY [Unit], [HomeName]`,
    )

    console.log(`📍 Raw query result: ${homes.length} records`)

    if (homes.length > 0) {
      console.log("First record coordinates:", {
        HomeName: homes[0].HomeName,
        Latitude: homes[0].Latitude,
        LatitudeType: typeof homes[0].Latitude,
        Longitude: homes[0].Longitude,
        LongitudeType: typeof homes[0].Longitude,
        Unit: homes[0].Unit,
        City: homes[0].City,
      })
    }

    // Additional validation to ensure coordinates are numbers
    const validHomes = homes.filter(
      (home) =>
        typeof home.Latitude === "number" &&
        typeof home.Longitude === "number" &&
        !isNaN(home.Latitude) &&
        !isNaN(home.Longitude) &&
        home.Latitude !== 0 &&
        home.Longitude !== 0,
    )

    console.log(`📍 Found ${validHomes.length} homes with valid numeric coordinates`)

    return NextResponse.json({
      success: true,
      homes: validHomes,
      count: validHomes.length,
      totalQueried: homes.length,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("=== ❌ Homes for map query failed ===", error)
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
