import { NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function GET() {
  try {
    console.log("🏠 Fetching homes list with coordinates...")

    const homes = await query(`
      SELECT 
        HomeName,
        Street,
        City,
        State,
        Zip,
        HomePhone,
        Xref,
        CaseManager,
        Unit,
        Guid,
        CaseManagerEmail,
        CaseManagerPhone,
        CaregiverEmail,
        LastSync,
        CAST([Latitude] AS FLOAT) AS Latitude,
        CAST([Longitude] AS FLOAT) AS Longitude
      FROM SyncActiveHomes
      WHERE HomeName IS NOT NULL
      ORDER BY HomeName
    `)

    console.log(`📊 Retrieved ${homes.length} homes from SyncActiveHomes`)

    // Log coordinate data for debugging
    homes.forEach((home: any) => {
      if (home.Latitude && home.Longitude) {
        console.log(`✅ ${home.HomeName}: Lat=${home.Latitude}, Lng=${home.Longitude}`)
      } else {
        console.log(`❌ ${home.HomeName}: Missing coordinates`)
      }
    })

    return NextResponse.json({
      success: true,
      count: homes.length,
      homes: homes,
    })
  } catch (error: any) {
    console.error("❌ Database error in homes-list:", error)
    return NextResponse.json(
      {
        success: false,
        count: 0,
        homes: [],
        error: error.message,
      },
      { status: 500 },
    )
  }
}
