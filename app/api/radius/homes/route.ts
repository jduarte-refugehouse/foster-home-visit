import { NextRequest, NextResponse } from "next/server"
import { validateApiKey } from "@/lib/api-auth"
import { fetchHomesList, type ListHome } from "@/lib/db-extensions"

export const dynamic = "force-dynamic"

/**
 * GET /api/radius/homes
 * 
 * Proxy endpoint for accessing home data from RadiusBifrost
 * Requires API key authentication via x-api-key header
 * 
 * Query Parameters:
 * - unit: Filter by unit (optional)
 * - caseManager: Filter by case manager (optional)
 * - search: Search in name, address, or case manager (optional)
 * 
 * Returns: { success: boolean, count: number, homes: ListHome[], timestamp: string }
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now()

  try {
    // 1. Validate API key
    const apiKey = request.headers.get("x-api-key")
    console.log(`🔍 [RADIUS-API] Received API key request, prefix: ${apiKey?.substring(0, 12)}...`)
    console.log(`🔍 [RADIUS-API] API key length: ${apiKey?.length}, has value: ${!!apiKey}`)
    
    const validation = await validateApiKey(apiKey)

    if (!validation.valid) {
      console.warn(`🚫 [RADIUS-API] Invalid API key attempt: ${validation.error}`)
      console.warn(`🚫 [RADIUS-API] API key prefix received: ${apiKey?.substring(0, 12)}...`)
      console.warn(`🚫 [RADIUS-API] API key length: ${apiKey?.length}`)
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
          details: validation.error || "Invalid API key",
          debug: {
            apiKeyPrefix: apiKey?.substring(0, 12),
            apiKeyLength: apiKey?.length,
            hasApiKey: !!apiKey,
          },
        },
        { status: 401 }
      )
    }

    console.log(
      `✅ [RADIUS-API] Authenticated request from microservice: ${validation.key?.microservice_code}`
    )

    // 2. Parse query parameters
    const { searchParams } = new URL(request.url)
    const filters: {
      unit?: string
      caseManager?: string
      search?: string
    } = {}

    if (searchParams.get("unit")) {
      filters.unit = searchParams.get("unit")!
    }
    if (searchParams.get("caseManager")) {
      filters.caseManager = searchParams.get("caseManager")!
    }
    if (searchParams.get("search")) {
      filters.search = searchParams.get("search")!
    }

    // 3. Query RadiusBifrost directly
    console.log(`🏠 [RADIUS-API] Fetching homes with filters:`, filters)
    const homes = await fetchHomesList(filters)

    const duration = Date.now() - startTime

    console.log(
      `✅ [RADIUS-API] Successfully retrieved ${homes.length} homes in ${duration}ms`
    )

    // 4. Return response
    return NextResponse.json({
      success: true,
      count: homes.length,
      homes,
      timestamp: new Date().toISOString(),
      duration_ms: duration,
    })
  } catch (error) {
    const duration = Date.now() - startTime
    console.error("❌ [RADIUS-API] Error in homes endpoint:", error)

    return NextResponse.json(
      {
        success: false,
        count: 0,
        homes: [],
        error: error instanceof Error ? error.message : "Unknown error occurred",
        timestamp: new Date().toISOString(),
        duration_ms: duration,
      },
      { status: 500 }
    )
  }
}

