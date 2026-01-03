import { NextResponse } from "next/server"
import { query } from "@refugehouse/shared-core/db"
import { shouldUseRadiusApiClient } from "@/lib/microservice-config"
import { radiusApiClient } from "@refugehouse/radius-api-client"

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const xref = searchParams.get("xref")

    if (!xref) {
      return NextResponse.json(
        { success: false, error: "Missing xref parameter" },
        { status: 400 }
      )
    }

    console.log(`🔍 [API] Looking up home GUID for xref: ${xref} (type: ${typeof xref})`)

    // Always use direct DB access for home lookup because:
    // 1. GUID is required for prepopulation
    // 2. API client doesn't return GUID
    // 3. This is a simple lookup query that doesn't need API Hub routing
    console.log(`✅ [API] Using direct DB access for home lookup (GUID required)`)
    
    // Convert xref to number for query (Xref is INT in database)
    const xrefNum = parseInt(xref, 10)
    if (isNaN(xrefNum)) {
      console.error(`❌ [API] Invalid xref value: ${xref}`)
      return NextResponse.json(
        { success: false, error: `Invalid xref parameter: ${xref}` },
        { status: 400 }
      )
    }

    console.log(`🔍 [API] Querying for xref: ${xrefNum}`)
    
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

    console.log(`📊 [API] Query result: ${result?.length || 0} row(s) found`)

    if (!result || result.length === 0) {
      // Try to see if the home exists with a different query to help debug
      const debugResult = await query(
        `SELECT COUNT(*) as total FROM SyncActiveHomes`,
        []
      )
      console.warn(`⚠️ [API] No home found for xref: ${xrefNum} (Total homes in table: ${debugResult[0]?.total || 0})`)
      
      // Also try as string in case there's a type issue
      const stringResult = await query(
        `SELECT TOP 1 Guid as guid, HomeName as name, Xref as xref FROM SyncActiveHomes WHERE CAST(Xref AS VARCHAR) = @param0`,
        [xref]
      )
      if (stringResult && stringResult.length > 0) {
        console.log(`✅ [API] Found home using string comparison: ${stringResult[0].name}`)
        return NextResponse.json({
          success: true,
          guid: stringResult[0].guid,
          name: stringResult[0].name,
          xref: stringResult[0].xref,
        })
      }
      
      return NextResponse.json(
        { success: false, error: `Home not found for xref: ${xrefNum}` },
        { status: 404 }
      )
    }

    console.log(`✅ [API] Found home: ${result[0].name} (${result[0].guid})`)

    return NextResponse.json({
      success: true,
      guid: result[0].guid,
      name: result[0].name,
      xref: result[0].xref,
    })

  } catch (error: any) {
    console.error("❌ [API] Error looking up home GUID:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to lookup home GUID",
        details: error.message,
      },
      { status: 500 }
    )
  }
}

