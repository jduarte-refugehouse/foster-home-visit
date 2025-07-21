import { NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function GET() {
  try {
    console.log("🗺️ Fetching homes for map with explicit coordinate casting...")

    const homes = await query(`
      SELECT 
        Id,
        Name,
        Address,
        City,
        State,
        ZipCode,
        CAST([Latitude] AS FLOAT) AS Latitude,
        CAST([Longitude] AS FLOAT) AS Longitude,
        PhoneNumber,
        Email,
        Website,
        Description,
        Capacity,
        ServicesOffered,
        ContactPersonName,
        ContactPersonTitle,
        IsActive,
        CreatedDate,
        ModifiedDate
      FROM Homes 
      WHERE IsActive = 1 
      AND Latitude IS NOT NULL 
      AND Longitude IS NOT NULL
      AND CAST([Latitude] AS FLOAT) != 0
      AND CAST([Longitude] AS FLOAT) != 0
      ORDER BY Name
    `)

    console.log(`📊 Raw query returned ${homes.length} homes`)

    // Additional validation and type checking
    const validHomes = homes.filter((home: any) => {
      const lat = Number(home.Latitude)
      const lng = Number(home.Longitude)

      console.log(
        `🏠 ${home.Name}: Lat=${home.Latitude} (${typeof home.Latitude}), Lng=${home.Longitude} (${typeof home.Longitude})`,
      )
      console.log(`🔢 Converted: Lat=${lat} (${typeof lat}), Lng=${lng} (${typeof lng})`)

      const isValidLat = !isNaN(lat) && lat !== 0 && lat >= -90 && lat <= 90
      const isValidLng = !isNaN(lng) && lng !== 0 && lng >= -180 && lng <= 180

      if (!isValidLat || !isValidLng) {
        console.warn(`❌ Invalid coordinates for ${home.Name}: lat=${lat}, lng=${lng}`)
        return false
      }

      return true
    })

    console.log(`✅ Filtered to ${validHomes.length} homes with valid coordinates`)

    return NextResponse.json({
      success: true,
      homes: validHomes,
      total: validHomes.length,
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
