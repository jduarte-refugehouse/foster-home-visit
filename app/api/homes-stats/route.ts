import { NextResponse } from "next/server"
import { getHomeStats } from "@/lib/db-extensions"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    console.log("📊 API: Fetching home statistics...")
    const stats = await getHomeStats()

    console.log("✅ API: Successfully retrieved home statistics:", stats)

    return NextResponse.json({
      success: true,
      stats,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("❌ API: Error fetching home statistics:", error)

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch home statistics",
        message: error instanceof Error ? error.message : "Unknown error",
        stats: {
          totalHomes: 0,
          activeHomes: 0,
          totalCapacity: 0,
          currentResidents: 0,
          occupancyRate: 0,
        },
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
