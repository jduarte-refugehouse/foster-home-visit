import { NextRequest, NextResponse } from "next/server"
import { validateApiKey, hashApiKey } from "@/lib/api-auth"
import { query } from "@refugehouse/shared-core/db"
import { fetchHomesList, type ListHome } from "@/lib/db-extensions"

export const dynamic = "force-dynamic"
export const revalidate = 0 // Explicitly disable revalidation/caching
export const fetchCache = "force-no-store" // Disable fetch caching

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
  
  // Log that the endpoint was called
  console.log(`🔵 [RADIUS-API] /api/radius/homes endpoint called at ${new Date().toISOString()}`)
  console.log(`🔵 [RADIUS-API] Request URL: ${request.url}`)
  console.log(`🔵 [RADIUS-API] Request headers:`, {
    'x-api-key': request.headers.get("x-api-key") ? `${request.headers.get("x-api-key")?.substring(0, 12)}...` : 'MISSING',
    'user-agent': request.headers.get("user-agent"),
    'origin': request.headers.get("origin"),
  })

  try {
    // 1. Validate API key
    const apiKeyRaw = request.headers.get("x-api-key")
    const apiKey = apiKeyRaw?.trim() || null // Trim whitespace from header value
    console.log(`🔍 [RADIUS-API] Received API key request, prefix: ${apiKey?.substring(0, 12)}...`)
    console.log(`🔍 [RADIUS-API] API key length: ${apiKey?.length}, has value: ${!!apiKey}`)
    console.log(`🔍 [RADIUS-API] Raw API key length: ${apiKeyRaw?.length}, trimmed length: ${apiKey?.length}`)
    
    const validation = await validateApiKey(apiKey)

    if (!validation.valid) {
      console.warn(`🚫 [RADIUS-API] Invalid API key attempt: ${validation.error}`)
      console.warn(`🚫 [RADIUS-API] API key prefix received: ${apiKey?.substring(0, 12)}...`)
      console.warn(`🚫 [RADIUS-API] API key length: ${apiKey?.length}`)
      console.warn(`🚫 [RADIUS-API] Raw API key length: ${apiKeyRaw?.length}, trimmed: ${apiKey?.length}`)
      
      // Calculate hash of received key for comparison
      const receivedHash = apiKey ? hashApiKey(apiKey) : null
      
      // Get all active keys for comparison
      const allActiveKeys = await query<{
        api_key_prefix: string
        api_key_hash: string
        microservice_code: string
        is_active: boolean
      }>(
        `SELECT api_key_prefix, api_key_hash, microservice_code, is_active
         FROM api_keys 
         WHERE is_active = 1
         ORDER BY created_at DESC`
      )
      
      // Return detailed error information
      // NOTE: In development/testing, we show the full API key for debugging
      const isDevelopment = process.env.NODE_ENV === "development" || process.env.VERCEL_ENV === "preview"
      
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
          details: validation.error || "Invalid API key",
          debug: {
            // Show full API key in development/preview for debugging
            apiKey: isDevelopment ? apiKey : undefined,
            apiKeyPrefix: apiKey?.substring(0, 12),
            apiKeyLength: apiKey?.length,
            rawApiKeyLength: apiKeyRaw?.length,
            hasApiKey: !!apiKey,
            validationError: validation.error,
            receivedKeyHash: receivedHash ? `${receivedHash.substring(0, 16)}...` : null,
            fullReceivedKeyHash: isDevelopment ? receivedHash : undefined,
            allActiveKeysInDatabase: allActiveKeys.map(k => ({
              prefix: k.api_key_prefix,
              hash: `${k.api_key_hash.substring(0, 16)}...`,
              fullHash: isDevelopment ? k.api_key_hash : undefined,
              microservice: k.microservice_code,
              isActive: k.is_active,
            })),
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
    const response = NextResponse.json({
      success: true,
      count: homes.length,
      homes,
      timestamp: new Date().toISOString(),
      duration_ms: duration,
    })

    // Prevent caching to ensure fresh data (multiple layers)
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0, s-maxage=0')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
    response.headers.set('X-Vercel-Cache-Control', 'no-store') // Vercel-specific cache control
    response.headers.set('CDN-Cache-Control', 'no-store') // CDN cache control

    return response
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

