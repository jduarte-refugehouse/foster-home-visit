import { NextResponse } from "next/server"
import { getHomesStatistics } from "@/lib/db-extensions"

export async function GET() {
  try {
    console.log("📊 [API] Homes statistics endpoint called")

    // Use extension functions instead of directly calling the locked db
    const stats = await getHomesStatistics()

    console.log(`✅ [API] Successfully retrieved statistics:`, stats)

    return NextResponse.json({
      success: true,
      stats,
      debug: {
        timestamp: new Date().toISOString(),
      },
    })
  } catch (error: any) {
    console.error("❌ [API] Error in homes-stats:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        stats: {},
      },
      { status: 500 },
    )
  }
}
