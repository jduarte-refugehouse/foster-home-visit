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
    
    console.log(`🔐 [ADMIN-SERVICE] ==========================================`)
    console.log(`🔐 [ADMIN-SERVICE] Prepopulation Endpoint Called`)
    console.log(`🔐 [ADMIN-SERVICE] ------------------------------------------`)
    console.log(`🔐 [ADMIN-SERVICE] Request URL: ${request.url}`)
    console.log(`🔐 [ADMIN-SERVICE] Has API Key: ${apiKey ? "Yes (length: " + apiKey.length + ")" : "NO"}`)
    console.log(`🔐 [ADMIN-SERVICE] API Key (first 10 chars): ${apiKey ? apiKey.substring(0, 10) + "..." : "MISSING"}`)
    
    const validation = await validateApiKey(apiKey)

    if (!validation.valid) {
      console.error(`❌ [ADMIN-SERVICE] API Key validation failed:`, validation.error)
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

    console.log(`📋 [ADMIN-SERVICE] Home GUID: ${homeGuid}`)
    console.log(`📋 [ADMIN-SERVICE] Unit: ${unit}`)
    console.log(`📋 [ADMIN-SERVICE] Starting database queries...`)

    // 2. Get Home Information directly from database (this endpoint is in admin service - direct DB access allowed)
    let homeInfo: any = null
    try {
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
      
      if (homeResult && homeResult.length > 0) {
        const home = homeResult[0]
        homeInfo = {
          guid: home.Guid,
          homeName: home.HomeName,
          name: home.HomeName,
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
          primaryEmail: home.CaregiverEmail || null,
          caseManager: {
            name: home.CaseManager || null,
            email: home.CaseManagerEmail || null,
          },
          unit: home.Unit || null,
        }
        console.log(`✅ [RADIUS-API] Home info retrieved from database: ${homeInfo.homeName}`)
      } else {
        console.warn(`⚠️ [RADIUS-API] Home not found in database for GUID: ${homeGuid}`)
      }
    } catch (error: any) {
      console.error(`❌ [RADIUS-API] Error fetching home info from database:`, error)
    }

    // 3. Get License Information directly from database (this endpoint is in admin service - direct DB access allowed)
    let licenseData: any = null
    try {
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
          lc.LicenseID
        FROM syncLicenseCurrent lc
        WHERE lc.FacilityGUID = @param0
          AND lc.IsActive = 1
      `
      const licenseResult = await query(licenseQuery, [homeGuid])
      
      if (licenseResult && licenseResult.length > 0) {
        const license = licenseResult[0]
        licenseData = {
          legacyLicense: {
            licenseType: license.LicenseType || null,
            licenseEffectiveDate: license.LicenseEffective
              ? new Date(license.LicenseEffective).toISOString().split("T")[0]
              : null,
            licenseExpirationDate: license.LicenseExpiration
              ? new Date(license.LicenseExpiration).toISOString().split("T")[0]
              : null,
            totalCapacity: license.TotalCapacity || null,
            fosterCareCapacity: license.TotalCapacity || null,
            currentCensus: license.FilledBeds || 0,
            respiteOnly: license.RespiteOnly || false,
            serviceLevelsApproved: license.LegacyDFPSLevel ? [license.LegacyDFPSLevel] : [],
            originallyLicensed: license.OriginallyLicensed
              ? new Date(license.OriginallyLicensed).toISOString().split("T")[0]
              : null,
          },
          t3cCredentials: {
            hasT3C: false,
            isCompliant: false,
            isAuthorized: false,
          },
          licenseStatus: {
            type: "Legacy",
            effective: license.LicenseExpiration && new Date(license.LicenseExpiration) > new Date() ? "Active" : "Expired",
            displayText: license.LicenseType || "Legacy License",
          },
        }
        console.log(`✅ [RADIUS-API] License info retrieved from database: ${license.LicenseType}`)
      } else {
        console.warn(`⚠️ [RADIUS-API] No active license found for GUID: ${homeGuid}`)
        // Return empty license structure
        licenseData = {
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
        }
      }
    } catch (error: any) {
      console.error(`❌ [RADIUS-API] Error fetching license info from database:`, error)
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
      
      // Get API key for visit service call
      const radiusApiKey = process.env.RADIUS_API_KEY || apiKey
      
      const placementResponse = await fetch(placementHistoryUrl, {
        headers: {
          "Content-Type": "application/json",
          "x-api-key": radiusApiKey, // Include API key for server-to-server authentication
          "x-internal-service": "admin-service", // Indicate this is an internal service call
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

    // 9. Extract home information from database query results
    const homeName = homeInfo?.homeName || homeInfo?.name || "Unknown Home"
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

    // 10. Extract T3C credentials and legacy license information from database query results
    const t3cCredentials = licenseData?.t3cCredentials || {
      hasT3C: false,
      isCompliant: false,
      isAuthorized: false,
    }

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
        // Legacy License Information (from direct database query)
        legacyLicense: legacyLicenseInfo,
        // T3C Credentialing Information (from direct database query)
        t3cCredentials: t3cCredentials,
        // Combined License Status (from direct database query)
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

    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/e12938fe-54af-4ca0-be48-847cb3195b05',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/radius/homes/[homeGuid]/prepopulate/route.ts:401',message:'API response structure',data:{homeName:prepopulationData.home?.name,homePhone:prepopulationData.home?.phone,homeEmail:prepopulationData.home?.email,hasLicense:!!prepopulationData.license,hasLegacyLicense:!!prepopulationData.license?.legacyLicense,licenseType:prepopulationData.license?.legacyLicense?.licenseType,licenseEffectiveDate:prepopulationData.license?.legacyLicense?.licenseEffectiveDate,placementHistoryCount:prepopulationData.placementHistory?.length||0},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion

    return NextResponse.json({
      ...prepopulationData,
      timestamp: new Date().toISOString(),
      duration_ms: duration,
    })
  } catch (error: any) {
    const duration = Date.now() - startTime
    console.error(`❌ [ADMIN-SERVICE] ==========================================`)
    console.error(`❌ [ADMIN-SERVICE] ERROR in prepopulation endpoint`)
    console.error(`❌ [ADMIN-SERVICE] ------------------------------------------`)
    console.error(`❌ [ADMIN-SERVICE] Home GUID: ${params?.homeGuid || "UNKNOWN"}`)
    console.error(`❌ [ADMIN-SERVICE] Error Type: ${error?.constructor?.name || typeof error}`)
    console.error(`❌ [ADMIN-SERVICE] Error Message: ${error?.message || "No message"}`)
    console.error(`❌ [ADMIN-SERVICE] Error Stack:`, error?.stack || "No stack trace")
    console.error(`❌ [ADMIN-SERVICE] Full Error:`, JSON.stringify(error, Object.getOwnPropertyNames(error), 2))
    console.error(`❌ [ADMIN-SERVICE] Duration: ${duration}ms`)
    
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch home data",
        details: error?.message || "Unknown error",
        errorType: error?.constructor?.name || typeof error,
        homeGuid: params?.homeGuid || "UNKNOWN",
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
