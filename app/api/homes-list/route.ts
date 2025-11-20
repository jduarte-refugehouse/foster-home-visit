import { NextResponse, NextRequest } from "next/server"
import { radiusApiClient } from "@refugehouse/radius-api-client"

export const dynamic = "force-dynamic"

/**
 * GET /api/homes-list
 * 
 * Migrated to use API Hub instead of direct database access.
 * This endpoint now proxies requests through the centralized API hub.
 */
export async function GET(request: NextRequest) {
  try {
    console.log("🏠 [API] Homes list endpoint called (via API Hub)")

    // Parse query parameters for filtering
    const { searchParams } = new URL(request.url)
    const unit = searchParams.get("unit") || undefined
    const caseManager = searchParams.get("caseManager") || undefined
    const search = searchParams.get("search") || undefined

    // Fetch homes from API Hub
    const homes = await radiusApiClient.getHomes({
      unit,
      caseManager,
      search,
    })

    console.log(`✅ [API] Successfully retrieved ${homes.length} homes from API Hub`)

    return NextResponse.json({
      success: true,
      count: homes.length,
      homes,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("❌ [API] Error in homes-list:", error)

    return NextResponse.json(
      {
        success: false,
        count: 0,
        homes: [],
        error: error instanceof Error ? error.message : "Unknown error occurred",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
