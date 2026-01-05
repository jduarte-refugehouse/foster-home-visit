import { NextRequest, NextResponse } from "next/server"
import { validateApiKey } from "@/lib/api-auth"
import { query } from "@refugehouse/shared-core/db"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

/**
 * GET /api/radius/homes/[homeGuid]/prepopulate
 * 
 * Proxy endpoint for fetching home prepopulation data
 * Requires API key authentication via x-api-key header
 * 
 * Returns comprehensive data for prepopulating visit forms including:
 * - Home/license information (from HomeFolio + T3C credentialing)
 * - Household members
 * - Children in placement
 * - Placement Changes 6-month history
 * - Previous visit data
 * 
 * Uses new HomeFolio API endpoints for license information
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { homeGuid: string } }
) {
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

    const { homeGuid } = params
    const { searchParams } = new URL(request.url)
    const unit = searchParams.get("unit") || "DAL" // Default to DAL if not specified

    console.log(`📋 [RADIUS-API] Fetching pre-population data for home: ${homeGuid}, unit: ${unit}`)

    // Get admin service base URL (for internal API calls)
    const adminBaseUrl = process.env.ADMIN_SERVICE_URL || process.env.NEXT_PUBLIC_ADMIN_SERVICE_URL || "https://admin.test.refugehouse.app"
    
    // Get API key for admin service calls
    const radiusApiKey = process.env.RADIUS_API_KEY || apiKey // Use the validated API key from request or env var
    
    // 2. Get Simplified Home Information
    let homeInfo: any = null
    try {
      const homeInfoUrl = `${adminBaseUrl}/admin/api/homes/${homeGuid}/info`
      console.log(`📋 [RADIUS-API] Fetching home info from: ${homeInfoUrl}`)
      
      const homeInfoResponse = await fetch(homeInfoUrl, {
        headers: {
          "x-api-key": radiusApiKey,
          "Content-Type": "application/json",
        },
      })

      if (homeInfoResponse.ok) {
        const homeInfoData = await homeInfoResponse.json()
        homeInfo = homeInfoData.home
        console.log(`✅ [RADIUS-API] Home info retrieved successfully`)
      } else {
        console.warn(`⚠️ [RADIUS-API] Home info API returned ${homeInfoResponse.status}`)
      }
    } catch (error: any) {
      console.error(`❌ [RADIUS-API] Error fetching home info:`, error)
    }

    // 3. Get Combined License Information (PRIMARY ENDPOINT - contains legacy + T3C)
    let licenseData: any = null
    try {
      const licenseUrl = `${adminBaseUrl}/admin/api/homes/${homeGuid}/license-combined?unit=${unit}`
      console.log(`📋 [RADIUS-API] Fetching combined license from: ${licenseUrl}`)
      
      const licenseResponse = await fetch(licenseUrl, {
        headers: {
          "x-api-key": radiusApiKey,
          "Content-Type": "application/json",
        },
      })

      if (licenseResponse.ok) {
        const licenseResponseData = await licenseResponse.json()
        licenseData = licenseResponseData.license
        console.log(`✅ [RADIUS-API] Combined license retrieved successfully`)
      } else {
        console.warn(`⚠️ [RADIUS-API] Combined license API returned ${licenseResponse.status}`)
      }
    } catch (error: any) {
      console.error(`❌ [RADIUS-API] Error fetching combined license:`, error)
    }

    // 5. Get household members from syncCurrentFosterFacility (fallback if not in HomeFolio)
    const householdQuery = `
      SELECT
        PersonGUID,
        [Relation Name] as RelationName,
        Relationship,
        [Current Age] as CurrentAge
      FROM syncCurrentFosterFacility
      WHERE FosterHomeGuid = @param0
      ORDER BY
        CASE Relationship
          WHEN 'Provider' THEN 1
          WHEN 'Primary Caregiver' THEN 1
          WHEN 'Biological Child Resident' THEN 2
          WHEN 'Adult Resident' THEN 3
          WHEN 'Foster Placement' THEN 4
          WHEN 'Adoptive Child Resident' THEN 5
          ELSE 6
        END,
        RelationName
    `

    const householdMembers = await query(householdQuery, [homeGuid])

    // 6. Get children in placement from syncChildrenInPlacement
    const childrenQuery = `
      SELECT
        ChildGUID,
        FirstName,
        LastName,
        DateOfBirth,
        Contract,
        ServicePackage,
        PlacementDate,
        Status,
        NextCourtDate,
        NextAnnualMedicalDue,
        NextSemiAnnualDentalDue,
        SafetyPlanNextReview,
        HasActiveSafetyPlan
      FROM syncChildrenInPlacement
      WHERE FosterHomeGUID = @param0
        AND Status = 'Active'
      ORDER BY DateOfBirth
    `

    const childrenInPlacement = await query(childrenQuery, [homeGuid])

    // 7. Get placement changes (6-month history)
    let placementHistory: any[] = []
    try {
      const endDate = new Date()
      const startDate = new Date()
      startDate.setMonth(startDate.getMonth() - 6)

      const startDateStr = startDate.toISOString().split('T')[0]
      const endDateStr = endDate.toISOString().split('T')[0]

      // Call placement history endpoint (this is in the visit service, so we need the visit service URL)
      const visitServiceUrl = process.env.VISIT_SERVICE_URL || process.env.NEXT_PUBLIC_VISIT_SERVICE_URL || "https://visit.test.refugehouse.app"
      const placementHistoryUrl = `${visitServiceUrl}/api/placement-history?homeGUID=${encodeURIComponent(homeGuid)}&startDate=${startDateStr}&endDate=${endDateStr}`
      
      console.log(`📋 [RADIUS-API] Fetching placement history from: ${placementHistoryUrl}`)
      
      const placementResponse = await fetch(placementHistoryUrl, {
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (placementResponse.ok) {
        const placementData = await placementResponse.json()
        if (placementData.success && placementData.data) {
          placementHistory = Array.isArray(placementData.data) ? placementData.data : []
          console.log(`✅ [RADIUS-API] Retrieved ${placementHistory.length} placement history records`)
        }
      } else {
        console.warn(`⚠️ [RADIUS-API] Placement history API returned ${placementResponse.status}`)
      }
    } catch (error: any) {
      console.error(`❌ [RADIUS-API] Error fetching placement history:`, error)
    }

    // 8. Get previous visit data for carry-forward (most recent completed visit)
    const previousVisitQuery = `
      SELECT TOP 1
        vf.visit_form_id,
        vf.visit_date,
        vf.form_type,
        vf.visit_info,
        vf.family_info,
        vf.home_environment,
        vf.observations,
        vf.recommendations,
        vf.compliance_review
      FROM visit_forms vf
      INNER JOIN appointments a ON vf.appointment_id = a.appointment_id
      INNER JOIN SyncActiveHomes h ON a.home_xref = h.Xref
      WHERE h.Guid = @param0
        AND vf.status = 'completed'
        AND vf.is_deleted = 0
      ORDER BY vf.visit_date DESC
    `

    let previousVisit = null
    try {
      const previousVisitResult = await query(previousVisitQuery, [homeGuid])
      if (previousVisitResult && previousVisitResult.length > 0) {
        previousVisit = previousVisitResult[0]
      }
    } catch (error) {
      console.log("📋 [RADIUS-API] No previous visit data found (this is normal for first visits)")
    }

    // 9. Validate that we have required data from API calls
    if (!homeInfo && !licenseData) {
      console.error(`❌ [RADIUS-API] Both home info and license data API calls failed`)
      return NextResponse.json(
        {
          success: false,
          error: "Failed to fetch home and license information from HomeFolio API",
          details: "Both /admin/api/homes/:homeGUID/info and /admin/api/homes/:homeGUID/license-combined endpoints failed",
        },
        { status: 500 }
      )
    }

    // 10. Extract home information from API responses
    const homeName = homeInfo?.homeName || licenseData?.homeName || "Unknown Home"
    const address = homeInfo?.address || {
      street: "",
      street2: null,
      city: "",
      state: "",
      zip: "",
      county: null,
    }
    const homePhone = homeInfo?.phone || null
    const homeEmail = homeInfo?.primaryEmail || homeInfo?.email || null

    // 11. Extract T3C credentials from license data (already provided by license-combined endpoint)
    const t3cCredentials = licenseData?.t3cCredentials || {
      hasT3C: false,
      isCompliant: false,
      isAuthorized: false,
    }

    // 12. Extract legacy license information from API response
    const legacyLicenseInfo = licenseData?.legacyLicense || {
      licenseType: null,
      respiteOnly: false,
      licenseEffectiveDate: null,
      licenseExpirationDate: null,
      totalCapacity: null,
      fosterCareCapacity: null,
      currentCensus: childrenInPlacement.length, // Use active placements as census
      serviceLevelsApproved: [],
      homeTypes: [],
      originallyLicensed: null,
    }

    // 12. Prepare response data
    const prepopulationData = {
      success: true,
      home: {
        guid: homeGuid,
        name: homeName,
        address: {
          street: address.street || address.street1 || "",
          street2: address.street2 || null,
          city: address.city || "",
          state: address.state || "",
          zip: address.zip || "",
          county: address.county || null,
        },
        phone: homePhone,
        email: homeEmail,
        caseManager: {
          name: homeInfo?.caseManager?.name || null,
          email: homeInfo?.caseManager?.email || null,
        },
        // Home Logistics (basic info for display)
        logistics: {
          familyName: homeName,
          fullAddress: [
            address.street || address.street1,
            address.street2,
            address.city,
            address.state,
            address.zip,
          ].filter(Boolean).join(", "),
          phone: homePhone,
          email: homeEmail,
        },
      },
      license: {
        // Legacy License Information (from license-combined endpoint or fallback to database)
        legacyLicense: licenseData?.legacyLicense || legacyLicenseInfo,
        // T3C Credentialing Information (from license-combined endpoint)
        t3cCredentials: t3cCredentials,
        // Combined License Status (from license-combined endpoint)
        licenseStatus: licenseData?.licenseStatus || {
          type: "Legacy",
          effective: "Active",
          displayText: "Legacy License",
        },
      },
      household: {
        providers: householdMembers
          .filter(m => m.Relationship === "Provider" || m.Relationship === "Primary Caregiver")
          .map(m => ({
            guid: m.PersonGUID,
            name: m.RelationName,
            age: m.CurrentAge,
            relationship: m.Relationship,
          })),
        biologicalChildren: householdMembers
          .filter(m => m.Relationship === "Biological Child Resident")
          .map(m => ({
            guid: m.PersonGUID,
            name: m.RelationName,
            age: m.CurrentAge,
          })),
        otherHouseholdMembers: householdMembers
          .filter(m => 
            m.Relationship !== "Provider" && 
            m.Relationship !== "Primary Caregiver" &&
            m.Relationship !== "Biological Child Resident" &&
            m.Relationship !== "Foster Placement"
          )
          .map(m => ({
            guid: m.PersonGUID,
            name: m.RelationName,
            age: m.CurrentAge,
            relationship: m.Relationship,
          })),
      },
      placements: childrenInPlacement.map(child => ({
        guid: child.ChildGUID,
        firstName: child.FirstName,
        lastName: child.LastName,
        dateOfBirth: child.DateOfBirth,
        age: calculateAge(child.DateOfBirth),
        contract: child.Contract,
        servicePackage: child.ServicePackage,
        placementDate: child.PlacementDate,
        nextCourtDate: child.NextCourtDate,
        nextAnnualMedical: child.NextAnnualMedicalDue,
        nextDental: child.NextSemiAnnualDentalDue,
        safetyPlanReview: child.SafetyPlanNextReview,
        hasActiveSafetyPlan: child.HasActiveSafetyPlan,
      })),
      placementHistory: placementHistory, // 6-month placement changes history
      previousVisit: previousVisit ? {
        visitId: previousVisit.visit_form_id,
        visitDate: previousVisit.visit_date,
        formType: previousVisit.form_type,
        visitInfo: safeJsonParse(previousVisit.visit_info),
        familyInfo: safeJsonParse(previousVisit.family_info),
        homeEnvironment: safeJsonParse(previousVisit.home_environment),
        observations: safeJsonParse(previousVisit.observations),
        recommendations: safeJsonParse(previousVisit.recommendations),
        complianceReview: safeJsonParse(previousVisit.compliance_review),
      } : null,
    }

    const duration = Date.now() - startTime
    console.log(`✅ [RADIUS-API] Pre-population data prepared for ${homeName} in ${duration}ms`)
    console.log(`   - ${prepopulationData.household.providers.length} providers`)
    console.log(`   - ${prepopulationData.household.biologicalChildren.length} biological children`)
    console.log(`   - ${prepopulationData.placements.length} children in placement`)
    console.log(`   - ${placementHistory.length} placement history records`)
    console.log(`   - T3C Status: ${t3cCredentials.hasT3C ? (t3cCredentials.isCompliant ? "Compliant" : "Pending") : "Not T3C"}`)
    console.log(`   - License Type: ${prepopulationData.license.licenseStatus.type}`)
    console.log(`   - Previous visit: ${previousVisit ? "Found" : "None"}`)

    return NextResponse.json({
      ...prepopulationData,
      timestamp: new Date().toISOString(),
      duration_ms: duration,
    })
  } catch (error: any) {
    const duration = Date.now() - startTime
    console.error("❌ [RADIUS-API] Error fetching pre-population data:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch home data",
        details: error.message,
        timestamp: new Date().toISOString(),
        duration_ms: duration,
      },
      { status: 500 }
    )
  }
}


// Helper function to safely parse JSON
function safeJsonParse(jsonString: any): any {
  if (!jsonString) return null
  if (typeof jsonString === "string") {
    try {
      return JSON.parse(jsonString)
    } catch (error) {
      console.warn("⚠️ [RADIUS-API] Failed to parse JSON:", error)
      return null
    }
  }
  return jsonString
}

// Helper function to calculate age from date of birth
function calculateAge(dateOfBirth: string): number {
  if (!dateOfBirth) return 0
  const dob = new Date(dateOfBirth)
  const today = new Date()
  let age = today.getFullYear() - dob.getFullYear()
  const monthDiff = today.getMonth() - dob.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age--
  }
  return age
}
