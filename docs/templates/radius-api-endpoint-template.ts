import { NextRequest, NextResponse } from "next/server"
import { validateApiKey } from "@/lib/api-auth"
import { fetchYourData, type YourDataType } from "@/lib/db-extensions"

export const dynamic = "force-dynamic"

/**
 * GET /api/radius/your-endpoint-name
 * 
 * Description: What this endpoint does
 * Requires API key authentication via x-api-key header
 * 
 * Query Parameters:
 * - param1: Description (optional)
 * - param2: Description (optional)
 * 
 * Returns: { success: boolean, count: number, data: YourDataType[], timestamp: string }
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now()
  
  // Log that the endpoint was called
  console.log(`🔵 [RADIUS-API] /api/radius/your-endpoint-name endpoint called at ${new Date().toISOString()}`)
  console.log(`🔵 [RADIUS-API] Request URL: ${request.url}`)

  try {
    // 1. Validate API key
    const apiKeyRaw = request.headers.get("x-api-key")
    const apiKey = apiKeyRaw?.trim() || null
    console.log(`🔍 [RADIUS-API] Received API key request, prefix: ${apiKey?.substring(0, 12)}...`)
    
    const validation = await validateApiKey(apiKey)

    if (!validation.valid) {
      console.warn(`🚫 [RADIUS-API] Invalid API key attempt: ${validation.error}`)
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
          details: validation.error || "Invalid API key",
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
      param1?: string
      param2?: string
    } = {}

    if (searchParams.get("param1")) {
      filters.param1 = searchParams.get("param1")!
    }
    if (searchParams.get("param2")) {
      filters.param2 = searchParams.get("param2")!
    }

    // 3. Query RadiusBifrost directly
    console.log(`🔵 [RADIUS-API] Fetching data with filters:`, filters)
    const data = await fetchYourData(filters)

    const duration = Date.now() - startTime
    console.log(
      `✅ [RADIUS-API] Successfully retrieved ${data.length} records in ${duration}ms`
    )

    // 4. Return response
    return NextResponse.json({
      success: true,
      count: data.length,
      data, // Change "data" to a more specific name if needed (e.g., "items", "records")
      timestamp: new Date().toISOString(),
      duration_ms: duration,
    })
  } catch (error) {
    const duration = Date.now() - startTime
    console.error("❌ [RADIUS-API] Error in your-endpoint-name endpoint:", error)

    return NextResponse.json(
      {
        success: false,
        count: 0,
        data: [],
        error: error instanceof Error ? error.message : "Unknown error occurred",
        timestamp: new Date().toISOString(),
        duration_ms: duration,
      },
      { status: 500 }
    )
  }
}

