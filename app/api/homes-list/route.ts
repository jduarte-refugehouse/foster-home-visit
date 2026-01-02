import { NextResponse, NextRequest } from "next/server"
import { radiusApiClient } from "@refugehouse/radius-api-client"

export const dynamic = "force-dynamic"
export const revalidate = 0 // Explicitly disable revalidation/caching
export const fetchCache = "force-no-store" // Disable fetch caching

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
    
    // Debug: Log sample of lastSync values to verify data freshness
    if (homes.length > 0) {
      const sampleHomes = homes.slice(0, 3)
      console.log(`🔍 [API] Sample lastSync values:`, sampleHomes.map(h => ({
        name: h.name,
        lastSync: h.lastSync,
        caseManager: h.contactPersonName
      })))
    }

    const response = NextResponse.json({
      success: true,
      count: homes.length,
      homes,
      timestamp: new Date().toISOString(),
    })

    // Prevent caching to ensure fresh data (multiple layers)
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0, s-maxage=0')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
    response.headers.set('X-Vercel-Cache-Control', 'no-store') // Vercel-specific cache control
    response.headers.set('CDN-Cache-Control', 'no-store') // CDN cache control

    return response
  } catch (error) {
    console.error("❌ [API] Error in homes-list:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
    const errorStack = error instanceof Error ? error.stack : undefined

    return NextResponse.json(
      {
        success: false,
        count: 0,
        homes: [],
        error: errorMessage,
        stack: process.env.NODE_ENV === "development" ? errorStack : undefined,
        environment: {
          hasApiKey: !!process.env.RADIUS_API_KEY,
          apiHubUrl: process.env.RADIUS_API_HUB_URL || "https://admin.refugehouse.app (default)",
          apiKeyPrefix: process.env.RADIUS_API_KEY?.substring(0, 8) || "NOT SET",
        },
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
