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

    console.log(`🔍 [API] Looking up home GUID for xref: ${xref}`)

    const useApiClient = shouldUseRadiusApiClient()

    if (useApiClient) {
      // Use API client - but note: API doesn't return GUID, so we can only return xref and name
      // For full GUID lookup, we still need direct DB access
      console.log(`✅ [API] Using API client for home lookup (xref: ${xref})`)
      
      try {
        const homes = await radiusApiClient.getHomes()
        const home = homes.find((h) => h.id === xref)

        if (!home) {
          console.warn(`⚠️ [API] No home found for xref: ${xref}`)
          return NextResponse.json(
            { success: false, error: "Home not found for this xref" },
            { status: 404 }
          )
        }

        console.log(`✅ [API] Found home: ${home.name} (xref: ${xref})`)

        // Note: GUID is not available from API client, so we return null
        // Callers that need GUID should use direct DB access or API should be extended
        return NextResponse.json({
          success: true,
          guid: null, // GUID not available from API client
          name: home.name,
          xref: home.id,
          note: "GUID not available from API client - use direct DB access if GUID is required",
        })
      } catch (apiError) {
        console.error("❌ [API] Error fetching from API client, falling back to direct DB:", apiError)
        // Fall through to direct DB access
      }
    }

    // Direct database access (for admin microservice or when API client fails)
    // This is also needed when GUID is required, as API client doesn't return GUID
    console.log(`⚠️ [API] Using direct DB access for home lookup (admin microservice or GUID required)`)
    
    const result = await query(
      `
      SELECT TOP 1
        Guid as guid,
        HomeName as name,
        Xref as xref
      FROM SyncActiveHomes
      WHERE Xref = @param0
      `,
      [parseInt(xref)]
    )

    if (!result || result.length === 0) {
      console.warn(`⚠️ [API] No home found for xref: ${xref}`)
      return NextResponse.json(
        { success: false, error: "Home not found for this xref" },
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

