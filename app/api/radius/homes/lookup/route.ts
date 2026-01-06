import { NextRequest, NextResponse } from "next/server"
import { validateApiKey } from "@/lib/api-auth"
import { query } from "@refugehouse/shared-core/db"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

/**
 * GET /api/radius/homes/lookup
 * 
 * Look up a home by xref and return GUID
 * Requires API key authentication via x-api-key header
 * 
 * Query Parameters:
 * - xref: Home Xref (required)
 * 
 * Returns: { success: boolean, guid: string, name: string, xref: number }
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now()

  try {
    // 1. Validate API key
    const apiKeyRaw = request.headers.get("x-api-key")
    const apiKey = apiKeyRaw?.trim() || null
    const validation = await validateApiKey(apiKey)

    if (!validation.valid) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
          details: validation.error || "Invalid API key",
        },
        { status: 401 }
      )
    }

    // 2. Parse query parameters
    const { searchParams } = new URL(request.url)
    const xref = searchParams.get("xref")

    if (!xref) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required parameter: xref",
        },
        { status: 400 }
      )
    }

    console.log(`🔍 [RADIUS-API] Looking up home GUID for xref: ${xref} (type: ${typeof xref})`)

    // 3. Convert xref to number for query
    const xrefNum = parseInt(xref, 10)
    if (isNaN(xrefNum)) {
      console.error(`❌ [RADIUS-API] Invalid xref value: ${xref}`)
      return NextResponse.json(
        {
          success: false,
          error: `Invalid xref parameter: ${xref}`,
        },
        { status: 400 }
      )
    }

    // 4. Query for home with GUID
    const result = await query(
      `
      SELECT TOP 1
        Guid as guid,
        HomeName as name,
        Xref as xref
      FROM SyncActiveHomes
      WHERE Xref = @param0
    `,
      [xrefNum]
    )

    console.log(`📊 [RADIUS-API] Query result: ${result?.length || 0} row(s) found`)

    if (!result || result.length === 0) {
      // Try string comparison as fallback
      const stringResult = await query(
        `SELECT TOP 1 Guid as guid, HomeName as name, Xref as xref FROM SyncActiveHomes WHERE CAST(Xref AS VARCHAR) = @param0`,
        [xref]
      )
      if (stringResult && stringResult.length > 0) {
        console.log(`✅ [RADIUS-API] Found home using string comparison: ${stringResult[0].name}`)
        const duration = Date.now() - startTime
        return NextResponse.json({
          success: true,
          guid: stringResult[0].guid,
          name: stringResult[0].name,
          xref: stringResult[0].xref,
          timestamp: new Date().toISOString(),
          duration_ms: duration,
        })
      }

      return NextResponse.json(
        {
          success: false,
          error: `Home not found for xref: ${xrefNum}`,
        },
        { status: 404 }
      )
    }

    console.log(`✅ [RADIUS-API] Found home: ${result[0].name} (${result[0].guid})`)
    const duration = Date.now() - startTime

    return NextResponse.json({
      success: true,
      guid: result[0].guid,
      name: result[0].name,
      xref: result[0].xref,
      timestamp: new Date().toISOString(),
      duration_ms: duration,
    })
  } catch (error) {
    const duration = Date.now() - startTime
    console.error("❌ [RADIUS-API] Error in homes lookup:", error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
        timestamp: new Date().toISOString(),
        duration_ms: duration,
      },
      { status: 500 }
    )
  }
}

