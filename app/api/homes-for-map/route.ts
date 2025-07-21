import { NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const unitFilter = searchParams.get("unit")?.toUpperCase()

    console.log("🗺️ Fetching homes for map with explicit coordinate casting...")
    console.log(`🏢 Unit filter: ${unitFilter || "ALL"}`)

    let whereClause = `
      WHERE HomeName IS NOT NULL
      AND Latitude IS NOT NULL 
      AND Longitude IS NOT NULL
      AND CAST([Latitude] AS FLOAT) != 0
      AND CAST([Longitude] AS FLOAT) != 0
    `

    // Add unit filtering if specified
    if (unitFilter && (unitFilter === "DAL" || unitFilter === "SAN")) {
      whereClause += ` AND Unit = '${unitFilter}'`
    }

    const homes = await query(`
      SELECT 
        Guid as id,
        HomeName as name,
        Street as address,
        City,
        State,
        Zip as zipCode,
        Unit,
        CAST([Latitude] AS FLOAT) AS latitude,
        CAST([Longitude] AS FLOAT) AS longitude,
        HomePhone as phoneNumber,
        CaseManager as contactPersonName,
        CaseManagerEmail as email,
        Xref
      FROM SyncActiveHomes 
      ${whereClause}
      ORDER BY Unit, HomeName
    `)

    console.log(`📊 Raw query returned ${homes.length} homes`)

    // Additional validation and type checking
    const validHomes = homes.filter((home: any) => {
      const lat = Number(home.latitude)
      const lng = Number(home.longitude)

      console.log(
        `🏠 ${home.name} (${home.Unit}): Lat=${home.latitude} (${typeof home.latitude}), Lng=${home.longitude} (${typeof home.longitude})`,
      )

      const isValidLat = !isNaN(lat) && lat !== 0 && lat >= -90 && lat <= 90
      const isValidLng = !isNaN(lng) && lng !== 0 && lng >= -180 && lng <= 180

      if (!isValidLat || !isValidLng) {
        console.warn(`❌ Invalid coordinates for ${home.name}: lat=${lat}, lng=${lng}`)
        return false
      }

      return true
    })

    console.log(`✅ Filtered to ${validHomes.length} homes with valid coordinates`)

    // Group by unit for summary
    const unitSummary = validHomes.reduce((acc: any, home: any) => {
      const unit = home.Unit || "UNKNOWN"
      acc[unit] = (acc[unit] || 0) + 1
      return acc
    }, {})

    return NextResponse.json({
      success: true,
      homes: validHomes,
      total: validHomes.length,
      unitSummary,
      filter: unitFilter || "ALL",
      debug: {
        rawCount: homes.length,
        validCount: validHomes.length,
        timestamp: new Date().toISOString(),
      },
    })
  } catch (error: any) {
    console.error("❌ Database error in homes-for-map:", error)
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
