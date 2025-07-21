import { NextResponse } from "next/server"
import { getHomesStatistics } from "@/lib/db-extensions"

export async function GET() {
  try {
    console.log("📊 [API] Homes statistics endpoint called")

    const stats = await getHomesStatistics()

    console.log(`✅ [API] Statistics calculated:`, stats)

    return NextResponse.json({
      success: true,
      statistics: stats,
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error("❌ [API] Error in homes-stats:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        statistics: {},
      },
      { status: 500 },
    )
  }
}
