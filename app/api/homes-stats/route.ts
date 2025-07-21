import { NextResponse } from "next/server"
import { getHomesStats } from "@/lib/db-extensions"

export async function GET() {
  try {
    console.log("📈 [API] Homes stats endpoint called")

    const stats = await getHomesStats()

    console.log(`✅ [API] Successfully calculated statistics`)

    return NextResponse.json({
      success: true,
      stats,
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error("❌ [API] Error in homes-stats:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        stats: null,
      },
      { status: 500 },
    )
  }
}
