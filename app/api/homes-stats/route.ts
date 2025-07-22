import { NextResponse } from "next/server"
import { calculateHomesStats } from "@/lib/db-extensions"

// ⚠️⚠️⚠️ CRITICAL API ENDPOINT STABILITY WARNING ⚠️⚠️⚠️
// This endpoint is used by the dashboard and statistics components
// DO NOT change the response structure without updating all consuming components
// The dynamic and runtime exports are REQUIRED for proper Vercel deployment
// ⚠️⚠️⚠️ END STABILITY WARNING ⚠️⚠️⚠️

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function GET() {
  console.log("📊 [API] Homes stats endpoint called")

  try {
    const stats = await calculateHomesStats()

    console.log(`✅ [API] Successfully calculated stats for ${stats.total} homes`)

    // CRITICAL: This response structure is used by dashboard components
    // DO NOT modify without updating consuming components
    return NextResponse.json({
      success: true,
      stats,
    })
  } catch (error) {
    console.error("❌ [API] Error in homes-stats:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to calculate homes statistics",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
