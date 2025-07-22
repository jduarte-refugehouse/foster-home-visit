import { NextResponse } from "next/server"
import { getHomesForMap } from "@/lib/db-extensions"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    console.log("🗺️ API: Fetching homes for map...")
    const homes = await getHomesForMap()

    console.log(`✅ API: Successfully retrieved ${homes.length} homes for map`)

    return NextResponse.json({
      success: true,
      homes,
      count: homes.length,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("❌ API: Error fetching homes for map:", error)

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch homes for map",
        message: error instanceof Error ? error.message : "Unknown error",
        homes: [],
        count: 0,
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
