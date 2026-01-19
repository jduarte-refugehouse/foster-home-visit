import { NextRequest, NextResponse } from "next/server"
import { query } from "@refugehouse/shared-core/db"
import { validateApiKey } from "@/lib/api-auth"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

/**
 * GET /admin/api/homes/[homeGuid]/info
 * 
 * HomeFolio API endpoint for fetching home information
 * Requires API key authentication via x-api-key header
 * 
 * Returns basic home information from SyncActiveHomes
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { homeGuid: string } }
) {
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

    const { homeGuid } = params

    console.log(`📋 [HOMEFOLIO-API] Fetching home info for GUID: ${homeGuid}`)

    // 2. Query home information from SyncActiveHomes
    const homeQuery = `
      SELECT TOP 1
        h.Guid,
        h.HomeName,
        h.Address1,
        h.Address2,
        h.City,
        h.State,
        h.Zip,
        h.County,
        h.HomePhone,
        h.CaregiverEmail,
        h.CaseManager,
        h.CaseManagerEmail,
        h.Unit
      FROM SyncActiveHomes h
      WHERE h.Guid = @param0
    `

    const homeResult = await query(homeQuery, [homeGuid])

    if (!homeResult || homeResult.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Home not found",
          homeGuid: homeGuid,
        },
        { status: 404 }
      )
    }

    const home = homeResult[0]

    // 3. Format response
    const homeInfo = {
      guid: home.Guid,
      homeName: home.HomeName,
      name: home.HomeName, // Alias for compatibility
      address: {
        street: home.Address1 || "",
        street2: home.Address2 || null,
        city: home.City || "",
        state: home.State || "",
        zip: home.Zip || "",
        county: home.County || null,
      },
      phone: home.HomePhone || null,
      email: home.CaregiverEmail || null,
      primaryEmail: home.CaregiverEmail || null, // Alias for compatibility
      caseManager: {
        name: home.CaseManager || null,
        email: home.CaseManagerEmail || null,
      },
      unit: home.Unit || null,
    }

    console.log(`✅ [HOMEFOLIO-API] Home info retrieved: ${homeInfo.homeName}`)

    return NextResponse.json({
      success: true,
      home: homeInfo,
    })
  } catch (error: any) {
    console.error(`❌ [HOMEFOLIO-API] Error fetching home info:`, error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch home information",
        details: error.message || "Unknown error",
      },
      { status: 500 }
    )
  }
}

