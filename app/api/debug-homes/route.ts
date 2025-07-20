import { NextResponse } from "next/server"
import { query, healthCheck } from "@/lib/db"

export const runtime = "nodejs"

export async function GET() {
  try {
    console.log("=== 🔍 Debug homes query ===")

    const isHealthy = await healthCheck()
    if (!isHealthy) {
      return NextResponse.json({ success: false, error: "Database unhealthy" }, { status: 503 })
    }

    // Test 1: Count all homes
    const totalCount = await query("SELECT COUNT(*) as total FROM SyncActiveHomes")
    console.log("Total homes in table:", totalCount[0]?.total)

    // Test 2: Count homes with coordinates
    const coordCount = await query(`
      SELECT COUNT(*) as total 
      FROM SyncActiveHomes 
      WHERE [Latitude] IS NOT NULL AND [Longitude] IS NOT NULL
    `)
    console.log("Homes with coordinates:", coordCount[0]?.total)

    // Test 3: Get first 3 homes with all details
    const sampleHomes = await query(`
      SELECT TOP 3 [HomeName], [Unit], [Latitude], [Longitude], [City], [State]
      FROM SyncActiveHomes 
      WHERE [Latitude] IS NOT NULL AND [Longitude] IS NOT NULL
      ORDER BY [HomeName]
    `)
    console.log("Sample homes:", sampleHomes)

    // Test 4: Check for zero coordinates
    const zeroCoords = await query(`
      SELECT COUNT(*) as total 
      FROM SyncActiveHomes 
      WHERE ([Latitude] = 0 OR [Longitude] = 0) 
        AND [Latitude] IS NOT NULL AND [Longitude] IS NOT NULL
    `)
    console.log("Homes with zero coordinates:", zeroCoords[0]?.total)

    return NextResponse.json({
      success: true,
      totalHomes: totalCount[0]?.total || 0,
      homesWithCoords: coordCount[0]?.total || 0,
      homesWithZeroCoords: zeroCoords[0]?.total || 0,
      sampleHomes,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Debug query failed:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
