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
    
    // Get auth token for admin service calls (if needed)
    // Note: Since this is an internal API Hub endpoint, we may need to pass through auth
    const authHeader = request.headers.get("authorization")

    // 2. Get HomeFolio (contains home info, legacy license, T3C credentials)
    let folio: any = null
    let homeFolioError: string | null = null
    try {
      const folioUrl = `${adminBaseUrl}/admin/api/home-management/home/${homeGuid}/folio`
      console.log(`📋 [RADIUS-API] Fetching HomeFolio from: ${folioUrl}`)
      
      const folioResponse = await fetch(folioUrl, {
        headers: {
          ...(authHeader ? { Authorization: authHeader } : {}),
          "Content-Type": "application/json",
        },
      })

      if (folioResponse.ok) {
        const folioData = await folioResponse.json()
        folio = folioData.folio
        console.log(`✅ [RADIUS-API] HomeFolio retrieved successfully`)
      } else {
        homeFolioError = `HomeFolio API returned ${folioResponse.status}`
        console.warn(`⚠️ [RADIUS-API] ${homeFolioError}`)
      }
    } catch (error: any) {
      homeFolioError = error.message || "Failed to fetch HomeFolio"
      console.error(`❌ [RADIUS-API] Error fetching HomeFolio:`, error)
    }

    // 3. Get License Overview (legacy + T3C combined)
    let licenseOverview: any = null
    try {
      const licenseUrl = `${adminBaseUrl}/admin/license/homes/${homeGuid}/overview?unit=${unit}`
      console.log(`📋 [RADIUS-API] Fetching license overview from: ${licenseUrl}`)
      
      const licenseResponse = await fetch(licenseUrl, {
        headers: {
          ...(authHeader ? { Authorization: authHeader } : {}),
          "Content-Type": "application/json",
        },
      })

      if (licenseResponse.ok) {
        licenseOverview = await licenseResponse.json()
        console.log(`✅ [RADIUS-API] License overview retrieved successfully`)
      } else {
        console.warn(`⚠️ [RADIUS-API] License overview API returned ${licenseResponse.status}`)
      }
    } catch (error: any) {
      console.error(`❌ [RADIUS-API] Error fetching license overview:`, error)
    }

    // 4. Analyze T3C Status from HomeFolio
    const t3cStatus = folio?.data ? analyzeT3CStatus(folio.data) : {
      hasT3C: false,
      isAuthorized: false,
      hasLCPAASignature: false,
      hasT3CLeadSignature: false,
      isFullyCompliant: false,
      credential: null,
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

    // 9. Extract home information from HomeFolio or fallback to legacy
    const homeData = folio?.data?.home || {}
    const licenseData = folio?.data?.license || {}
    const homeName = homeData.homeName || licenseOverview?.homeName || "Unknown Home"
    const address = homeData.address || {
      street: licenseOverview?.address1 || "",
      street2: licenseOverview?.address2 || null,
      city: licenseOverview?.city || "",
      state: licenseOverview?.state || "",
      zip: licenseOverview?.zip || "",
      county: null,
    }

    // 10. Extract service levels from license data
    const serviceLevels = extractServiceLevels(licenseData, t3cStatus)

    // 11. Extract T3C service packages
    const t3cServicePackages = extractT3CServicePackages(folio?.data?.addenda || [])

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
        phone: homeData.phone || licenseOverview?.phone || null,
        email: homeData.primaryEmail || homeData.email || null,
        caseManager: {
          name: homeData.caseManager?.name || null,
          email: homeData.caseManager?.email || null,
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
          phone: homeData.phone || licenseOverview?.phone || null,
          email: homeData.primaryEmail || homeData.email || null,
        },
      },
      license: {
        // Legacy License Information
        legacyLicense: {
          licenseType: determineLicenseType(licenseData, licenseOverview),
          respiteOnly: !licenseData.foster,
          licenseEffectiveDate: licenseOverview?.homeTypes?.[0]?.effectiveDt || licenseData.effectiveDate || null,
          licenseExpirationDate: licenseOverview?.homeTypes?.[0]?.expirationDt || null,
          totalCapacity: licenseData.totalCapacity || licenseOverview?.totalCapacity || null,
          fosterCareCapacity: licenseData.placementCapacity || null,
          currentCensus: childrenInPlacement.length, // Use active placements as census
          serviceLevelsApproved: serviceLevels,
          homeTypes: licenseOverview?.homeTypes || [],
          originallyLicensed: licenseData.originallyLicensed || null,
        },
        // T3C Credentialing Information
        t3cCredentials: t3cStatus.hasT3C ? {
          hasT3C: true,
          isCompliant: t3cStatus.isFullyCompliant,
          isAuthorized: t3cStatus.isAuthorized,
          credential: t3cStatus.credential,
          status: t3cStatus.isFullyCompliant ? "Compliant" :
                 t3cStatus.hasT3CLeadSignature ? "Pending LCPAA" :
                 "Pending T3C Lead",
          authorizations: {
            lcpaa: {
              authorized: t3cStatus.hasLCPAASignature,
              authorizedBy: t3cStatus.lcpaaAuthorizedBy,
              authorizedDate: t3cStatus.lcpaaAuthorizedDate,
            },
            t3cLead: {
              authorized: t3cStatus.hasT3CLeadSignature,
              authorizedBy: t3cStatus.t3cLeadAuthorizedBy,
              authorizedDate: t3cStatus.t3cLeadAuthorizedDate,
            },
          },
          servicePackages: t3cServicePackages,
        } : {
          hasT3C: false,
          isCompliant: false,
          isAuthorized: false,
        },
        // Combined License Status (for display)
        licenseStatus: {
          type: t3cStatus.hasT3C ? "T3C" : "Legacy",
          effective: t3cStatus.hasT3C ?
            (t3cStatus.isFullyCompliant ? "Active" : "Pending") :
            "Active",
          displayText: t3cStatus.hasT3C ?
            `T3C ${t3cStatus.isFullyCompliant ? "Compliant" : "Pending"}` :
            "Legacy License",
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
    console.log(`   - T3C Status: ${t3cStatus.hasT3C ? (t3cStatus.isFullyCompliant ? "Compliant" : "Pending") : "Not T3C"}`)
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

// Helper function to analyze T3C status from HomeFolio data
function analyzeT3CStatus(folioData: any): {
  hasT3C: boolean
  isAuthorized: boolean
  hasLCPAASignature: boolean
  hasT3CLeadSignature: boolean
  isFullyCompliant: boolean
  credential: string | null
  lcpaaAuthorizedBy: string | null
  lcpaaAuthorizedDate: string | null
  t3cLeadAuthorizedBy: string | null
  t3cLeadAuthorizedDate: string | null
} {
  if (!folioData || !folioData.addenda) {
    return {
      hasT3C: false,
      isAuthorized: false,
      hasLCPAASignature: false,
      hasT3CLeadSignature: false,
      isFullyCompliant: false,
      credential: null,
      lcpaaAuthorizedBy: null,
      lcpaaAuthorizedDate: null,
      t3cLeadAuthorizedBy: null,
      t3cLeadAuthorizedDate: null,
    }
  }

  const addenda = Array.isArray(folioData.addenda) ? folioData.addenda : []
  
  // Find T3C credential addenda
  const t3cAddenda = addenda.filter((a: any) =>
    a.addendum_type === "T3C_CREDENTIAL_BASIC_FFH" ||
    a.credential_awarded === "T3C_BASIC_FOSTER_FAMILY_HOME" ||
    (a.credential_awarded && a.credential_awarded.startsWith("T3C_")) ||
    (a.t3cBlueprintCredentials && a.t3cBlueprintCredentials.length > 0)
  )

  if (t3cAddenda.length === 0) {
    return {
      hasT3C: false,
      isAuthorized: false,
      hasLCPAASignature: false,
      hasT3CLeadSignature: false,
      isFullyCompliant: false,
      credential: null,
      lcpaaAuthorizedBy: null,
      lcpaaAuthorizedDate: null,
      t3cLeadAuthorizedBy: null,
      t3cLeadAuthorizedDate: null,
    }
  }

  // Check most recent T3C addendum
  const latestT3C = t3cAddenda[t3cAddenda.length - 1]
  const authorizations = latestT3C.authorizations || []

  // Check for LCPAA/Program Director authorization
  const lcpaaAuth = authorizations.find((auth: any) =>
    auth.role === "LCPAA/Program Director" && auth.authorizedBy
  )
  const hasLCPAA = !!lcpaaAuth

  // Check for T3C Transition Team Lead authorization
  const t3cLeadAuth = authorizations.find((auth: any) =>
    auth.role === "T3C Transition Team Lead" && auth.authorizedBy
  )
  const hasT3CLead = !!t3cLeadAuth

  // Home is fully compliant when both required signatures are present
  const isFullyCompliant = hasLCPAA && hasT3CLead

  return {
    hasT3C: true,
    isAuthorized: hasT3CLead, // T3C Lead authorization = credential authorized
    hasLCPAASignature: hasLCPAA,
    hasT3CLeadSignature: hasT3CLead,
    isFullyCompliant,
    credential: latestT3C.credential_awarded || "T3C_BASIC_FOSTER_FAMILY_HOME",
    lcpaaAuthorizedBy: lcpaaAuth?.authorizedBy || null,
    lcpaaAuthorizedDate: lcpaaAuth?.authorizedDate || null,
    t3cLeadAuthorizedBy: t3cLeadAuth?.authorizedBy || null,
    t3cLeadAuthorizedDate: t3cLeadAuth?.authorizedDate || null,
  }
}

// Helper function to determine license type
function determineLicenseType(licenseData: any, licenseOverview: any): string {
  if (licenseData.verification) return "Full"
  if (licenseOverview?.licenseType) return licenseOverview.licenseType
  return "Pending"
}

// Helper function to extract service levels
function extractServiceLevels(licenseData: any, t3cStatus: any): string[] {
  const levels: string[] = []

  // Extract from legacy license data
  if (licenseData?.levels) {
    if (licenseData.levels.basic) levels.push("Basic")
    if (licenseData.levels.moderate) levels.push("Moderate")
    if (licenseData.levels.specialized) levels.push("Specialized")
    if (licenseData.levels.intensive) levels.push("Intensive")
    if (licenseData.levels.medicalNeeds) levels.push("Medical Needs")
  }

  // If no levels from license data, check T3C service packages
  if (levels.length === 0 && t3cStatus.hasT3C) {
    // T3C service packages might indicate service levels
    // This is a fallback - actual service levels should come from license data
    levels.push("Basic") // Default
  }

  return levels.length > 0 ? levels : ["Basic"] // Always include Basic as minimum
}

// Helper function to extract T3C service packages
function extractT3CServicePackages(addenda: any[]): Array<{
  packageId: string
  packageName: string
  status: string
}> {
  if (!addenda || !Array.isArray(addenda)) return []

  const t3cAddenda = addenda.filter((a: any) =>
    a.addendum_type === "T3C_CREDENTIAL_BASIC_FFH" ||
    (a.credential_awarded && a.credential_awarded.startsWith("T3C_"))
  )

  const packages: Array<{ packageId: string; packageName: string; status: string }> = []

  t3cAddenda.forEach((addendum: any) => {
    if (addendum.servicePackages && Array.isArray(addendum.servicePackages)) {
      packages.push(...addendum.servicePackages.map((pkg: any) => ({
        packageId: pkg.packageId || pkg.id || "",
        packageName: pkg.packageName || pkg.name || getPackageName(pkg.packageId || pkg.id || ""),
        status: pkg.status || "ACTIVE",
      })))
    } else if (addendum.t3cBlueprintCredentials && Array.isArray(addendum.t3cBlueprintCredentials)) {
      packages.push(...addendum.t3cBlueprintCredentials.map((id: string) => ({
        packageId: id,
        packageName: getPackageName(id),
        status: "ACTIVE",
      })))
    }
  })

  return packages
}

// Helper function to get package name from package ID
function getPackageName(packageId: string): string {
  const packageNames: Record<string, string> = {
    BASIC_FFH: "T3C Basic Foster Family Home Support Services",
    MENTAL_BEHAVIORAL_HEALTH: "Mental & Behavioral Health Support Services",
    IDD_AUTISM: "IDD/Autism Spectrum Disorder Support Services",
    SUBSTANCE_USE: "Substance Use Support Services",
    SHORT_TERM_ASSESSMENT: "Short-Term Assessment Support Services",
    TREATMENT_FOSTER_CARE: "T3C Treatment Foster Family Care Support Services",
  }
  return packageNames[packageId] || packageId
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
