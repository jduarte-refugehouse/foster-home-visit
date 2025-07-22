import { type NextRequest, NextResponse } from "next/server"
import { fetchHomesList } from "@/lib/db-extensions"

// ⚠️⚠️⚠️ CRITICAL API ENDPOINT STABILITY WARNING ⚠️⚠️⚠️
// This endpoint is used by the homes-list page and other components
// DO NOT change the response structure without updating all consuming components
// The dynamic and runtime exports are REQUIRED for proper Vercel deployment
// ⚠️⚠️⚠️ END STABILITY WARNING ⚠️⚠️⚠️

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function GET(request: NextRequest) {
  console.log("📋 [API] Homes list endpoint called")

  try {
    const { searchParams } = new URL(request.url)
    const unit = searchParams.get("unit") || undefined
    const caseManager = searchParams.get("caseManager") || undefined
    const search = searchParams.get("search") || undefined

    console.log("🔍 [API] Filters applied:", { unit, caseManager, search })

    const homes = await fetchHomesList({ unit, caseManager, search })

    console.log(`✅ [API] Successfully processed ${homes.length} homes for list`)

    // CRITICAL: This response structure is used by homes-list page
    // DO NOT modify without updating consuming components
    return NextResponse.json({
      success: true,
      homes,
      count: homes.length,
    })
  } catch (error) {
    console.error("❌ [API] Error in homes-list:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch homes list",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
