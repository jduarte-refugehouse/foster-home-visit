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

    // Using the exact column structure you provided
    const homes = await query(
      `SELECT [HomeName], [Street], [City], [State], [Zip], [HomePhone], 
              [Xref], [CaseManager], [Unit], [Guid], [CaseManagerEmail], 
              [CaseManagerPhone], [CaregiverEmail], [LastSync], [Latitude], [Longitude]
       FROM SyncActiveHomes 
       WHERE [Latitude] IS NOT NULL 
         AND [Longitude] IS NOT NULL
         AND [Latitude] != 0 
         AND [Longitude] != 0
       ORDER BY [Unit], [HomeName]`,
    )

    console.log(`📍 Found ${homes.length} homes with valid coordinates`)

    // Log a sample of the data for debugging
    if (homes.length > 0) {
      console.log("Sample home data:", {
        HomeName: homes[0].HomeName,
        Unit: homes[0].Unit,
        Latitude: homes[0].Latitude,
        Longitude: homes[0].Longitude,
        City: homes[0].City,
      })
    }

    return NextResponse.json({
      success: true,
      homes,
      count: homes.length,
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
