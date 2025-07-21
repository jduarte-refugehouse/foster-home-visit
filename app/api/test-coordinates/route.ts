import { NextResponse } from "next/server"
import { getConnection } from "@/lib/db"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function GET() {
  console.log("=== 🧪 Testing coordinate column access ===")

  try {
    const pool = await getConnection()

    // Test coordinate access with proper SQL Server syntax
    const coordinateTest = await pool.request().query(`
      SELECT TOP 5
        [Xref] as id,
        [HomeName] as name,
        [Street] as address,
        [City],
        [State],
        [Zip] as zipCode,
        [Unit],
        CAST([Latitude] AS FLOAT) as latitude,
        CAST([Longitude] AS FLOAT) as longitude,
        [HomePhone] as phoneNumber,
        [CaseManager] as contactPersonName,
        [CaseManagerEmail] as email,
        [CaseManagerPhone] as contactPhone,
        [LastSync] as lastSync
      FROM SyncActiveHomes
      WHERE [Latitude] IS NOT NULL 
        AND [Longitude] IS NOT NULL
        AND [Latitude] != 0 
        AND [Longitude] != 0
      ORDER BY [HomeName]
    `)

    console.log(`✅ Coordinate test successful: ${coordinateTest.recordset.length} homes with coordinates`)

    return NextResponse.json({
      success: true,
      message: "Coordinate access test successful",
      count: coordinateTest.recordset.length,
      sample: coordinateTest.recordset,
    })
  } catch (error) {
    console.error("Coordinate test failed:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Coordinate test failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
