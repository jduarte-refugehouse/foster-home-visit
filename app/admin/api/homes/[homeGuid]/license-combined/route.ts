import { NextRequest, NextResponse } from "next/server"
import { query } from "@refugehouse/shared-core/db"
import { validateApiKey } from "@/lib/api-auth"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

/**
 * GET /admin/api/homes/[homeGuid]/license-combined
 * 
 * HomeFolio API endpoint for fetching combined license information
 * (Legacy license + T3C credentialing)
 * Requires API key authentication via x-api-key header
 * 
 * Query Parameters:
 * - unit: Unit code (DAL, SAN, etc.) - defaults to DAL
 * 
 * Returns combined license information from syncLicenseCurrent
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
    const { searchParams } = new URL(request.url)
    const unit = searchParams.get("unit") || "DAL"

    console.log(`📋 [HOMEFOLIO-API] Fetching combined license for GUID: ${homeGuid}, unit: ${unit}`)

    // 2. Query license information from syncLicenseCurrent
    const licenseQuery = `
      SELECT TOP 1
        lc.LicenseType,
        lc.LicenseEffective,
        lc.LicenseExpiration,
        lc.TotalCapacity,
        lc.OpenBeds,
        lc.FilledBeds,
        lc.OriginallyLicensed,
        lc.RespiteOnly,
        lc.LegacyDFPSLevel,
        lc.LicenseID,
        lc.HomeName
      FROM syncLicenseCurrent lc
      WHERE lc.FacilityGUID = @param0
        AND lc.IsActive = 1
    `

    const licenseResult = await query(licenseQuery, [homeGuid])

    if (!licenseResult || licenseResult.length === 0) {
      console.warn(`⚠️ [HOMEFOLIO-API] No active license found for GUID: ${homeGuid}`)
      // Return empty license structure instead of 404
      return NextResponse.json({
        success: true,
        license: {
          legacyLicense: {
            licenseType: null,
            licenseEffectiveDate: null,
            licenseExpirationDate: null,
            totalCapacity: null,
            fosterCareCapacity: null,
            currentCensus: 0,
            respiteOnly: false,
            serviceLevelsApproved: [],
            originallyLicensed: null,
          },
          t3cCredentials: {
            hasT3C: false,
            isCompliant: false,
            isAuthorized: false,
          },
          licenseStatus: {
            type: "Legacy",
            effective: "Not Found",
            displayText: "No Active License",
          },
        },
      })
    }

    const license = licenseResult[0]

    // 3. Format legacy license information
    const legacyLicense = {
      licenseType: license.LicenseType || null,
      licenseEffectiveDate: license.LicenseEffective
        ? new Date(license.LicenseEffective).toISOString().split("T")[0]
        : null,
      licenseExpirationDate: license.LicenseExpiration
        ? new Date(license.LicenseExpiration).toISOString().split("T")[0]
        : null,
      totalCapacity: license.TotalCapacity || null,
      fosterCareCapacity: license.TotalCapacity || null, // Use same as total capacity
      currentCensus: license.FilledBeds || 0,
      respiteOnly: license.RespiteOnly || false,
      serviceLevelsApproved: license.LegacyDFPSLevel ? [license.LegacyDFPSLevel] : [],
      originallyLicensed: license.OriginallyLicensed
        ? new Date(license.OriginallyLicensed).toISOString().split("T")[0]
        : null,
    }

    // 4. Format T3C credentials (placeholder - T3C data would come from separate source)
    const t3cCredentials = {
      hasT3C: false, // TODO: Query T3C credentialing data when available
      isCompliant: false,
      isAuthorized: false,
    }

    // 5. Determine license status
    const licenseStatus = {
      type: "Legacy",
      effective: license.LicenseExpiration && new Date(license.LicenseExpiration) > new Date() ? "Active" : "Expired",
      displayText: license.LicenseType || "Legacy License",
    }

    console.log(`✅ [HOMEFOLIO-API] Combined license retrieved: ${license.LicenseType}`)

    return NextResponse.json({
      success: true,
      license: {
        legacyLicense,
        t3cCredentials,
        licenseStatus,
      },
    })
  } catch (error: any) {
    console.error(`❌ [HOMEFOLIO-API] Error fetching combined license:`, error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch license information",
        details: error.message || "Unknown error",
      },
      { status: 500 }
    )
  }
}

