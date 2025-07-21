import { NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function GET() {
  try {
    console.log("📋 Fetching homes list with coordinate casting...")

    const homes = await query(`
      SELECT 
        Guid,
        HomeName,
        Street,
        City,
        State,
        Zip,
        Unit,
        HomePhone,
        CaseManager,
        CaseManagerEmail,
        CaseManagerPhone,
        CAST([Latitude] AS FLOAT) AS Latitude,
        CAST([Longitude] AS FLOAT) AS Longitude,
        LastSync,
        Xref
      FROM SyncActiveHomes 
      WHERE HomeName IS NOT NULL
      ORDER BY Unit, HomeName
    `)

    console.log(`📊 Retrieved ${homes.length} homes from database`)

    // Process homes to add coordinate status
    const processedHomes = homes.map((home: any) => {
      const lat = Number(home.Latitude)
      const lng = Number(home.Longitude)

      const hasValidCoordinates =
        !isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0 && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180

      return {
        ...home,
        hasCoordinates: hasValidCoordinates,
        coordinateDisplay: hasValidCoordinates ? `${lat.toFixed(6)}, ${lng.toFixed(6)}` : "No coordinates",
      }
    })

    return NextResponse.json({
      success: true,
      homes: processedHomes,
      total: processedHomes.length,
      withCoordinates: processedHomes.filter((h) => h.hasCoordinates).length,
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error("❌ Database error in homes-list:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        homes: [],
        total: 0,
      },
      { status: 500 },
    )
  }
}
