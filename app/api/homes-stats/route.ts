import { NextResponse } from "next/server"
import { getHomesStatistics } from "@/lib/db-extensions"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function GET() {
  console.log("📈 [API] Homes stats endpoint called")

  try {
    const stats = await getHomesStatistics()

    console.log("✅ [API] Successfully calculated statistics")

    return NextResponse.json({
      success: true,
      stats,
    })
  } catch (error) {
    console.error("❌ [API] Error in homes-stats:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to calculate statistics",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
