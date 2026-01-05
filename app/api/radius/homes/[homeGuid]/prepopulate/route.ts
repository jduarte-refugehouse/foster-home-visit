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
        // Check if we got useful data (not just an empty object)
        const hasUsefulData = homeInfo && (homeInfo.homeName || homeInfo.name || homeInfo.phone || homeInfo.email)
        if (!hasUsefulData) {
          console.warn(`⚠️ [RADIUS-API] Home info API returned empty data`)
          homeInfo = null // Treat empty data as failure
        } else {
          console.log(`✅ [RADIUS-API] Home info retrieved successfully`)
        }
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/e12938fe-54af-4ca0-be48-847cb3195b05',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/radius/homes/[homeGuid]/prepopulate/route.ts:73',message:'HomeFolio home info API response',data:{hasHome:!!homeInfo,homeName:homeInfo?.homeName||homeInfo?.name,homePhone:homeInfo?.phone,homeEmail:homeInfo?.primaryEmail||homeInfo?.email,hasAddress:!!homeInfo?.address,hasUsefulData},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
        // #endregion
      } else {
        console.warn(`⚠️ [RADIUS-API] Home info API returned ${homeInfoResponse.status}`)
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/e12938fe-54af-4ca0-be48-847cb3195b05',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/radius/homes/[homeGuid]/prepopulate/route.ts:77',message:'HomeFolio home info API failed',data:{status:homeInfoResponse.status,statusText:homeInfoResponse.statusText},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
        // #endregion
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
        // Check if we got useful data (not just an empty object)
        const hasUsefulData = licenseData && (
          licenseData.legacyLicense?.licenseType || 
          licenseData.legacyLicense?.licenseEffectiveDate ||
          licenseData.legacyLicense?.totalCapacity ||
          licenseData.licenseStatus?.type
        )
        if (!hasUsefulData) {
          console.warn(`⚠️ [RADIUS-API] License API returned empty data`)
          licenseData = null // Treat empty data as failure
        } else {
          console.log(`✅ [RADIUS-API] Combined license retrieved successfully`)
        }
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/e12938fe-54af-4ca0-be48-847cb3195b05',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/radius/homes/[homeGuid]/prepopulate/route.ts:108',message:'HomeFolio license API response',data:{hasLicense:!!licenseData,hasLegacyLicense:!!licenseData?.legacyLicense,licenseType:licenseData?.legacyLicense?.licenseType,licenseEffectiveDate:licenseData?.legacyLicense?.licenseEffectiveDate,licenseExpirationDate:licenseData?.legacyLicense?.licenseExpirationDate,totalCapacity:licenseData?.legacyLicense?.totalCapacity,hasUsefulData},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
        // #endregion
      } else {
        console.warn(`⚠️ [RADIUS-API] Combined license API returned ${licenseResponse.status}`)
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/e12938fe-54af-4ca0-be48-847cb3195b05',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/radius/homes/[homeGuid]/prepopulate/route.ts:120',message:'HomeFolio license API failed',data:{status:licenseResponse.status,statusText:licenseResponse.statusText},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
        // #endregion
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

    // 9. Fallback: Get basic home and license info from database if HomeFolio APIs failed
    // This is allowed because this endpoint is in the admin service (has direct DB access)
    let fallbackHomeInfo: any = null
    let fallbackLicenseInfo: any = null
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/e12938fe-54af-4ca0-be48-847cb3195b05',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/radius/homes/[homeGuid]/prepopulate/route.ts:235',message:'Fallback check',data:{hasHomeInfo:!!homeInfo,hasLicenseData:!!licenseData,willUseFallback:(!homeInfo||!licenseData)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H'})}).catch(()=>{});
    // #endregion
    // Use fallback if EITHER API failed (not both) - we need both home and license data
    if (!homeInfo || !licenseData) {
      console.warn(`⚠️ [RADIUS-API] HomeFolio APIs failed, attempting database fallback for basic home info`)
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/e12938fe-54af-4ca0-be48-847cb3195b05',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/radius/homes/[homeGuid]/prepopulate/route.ts:237',message:'Fallback triggered - querying database',data:{homeGuid},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H'})}).catch(()=>{});
      // #endregion
      try {
        const fallbackQuery = `
          SELECT TOP 1
            h.HomeName,
            h.Address1,
            h.Address2,
            h.City,
            h.State,
            h.Zip,
            h.County,
            h.HomePhone,
            h.CaregiverEmail
          FROM SyncActiveHomes h
          WHERE h.Guid = @param0
        `
        const fallbackResult = await query(fallbackQuery, [homeGuid])
        if (fallbackResult && fallbackResult.length > 0) {
          fallbackHomeInfo = {
            homeName: fallbackResult[0].HomeName,
            address: {
              street: fallbackResult[0].Address1 || "",
              street2: fallbackResult[0].Address2 || null,
              city: fallbackResult[0].City || "",
              state: fallbackResult[0].State || "",
              zip: fallbackResult[0].Zip || "",
              county: fallbackResult[0].County || null,
            },
            phone: fallbackResult[0].HomePhone || null,
            email: fallbackResult[0].CaregiverEmail || null,
          }
          console.log(`✅ [RADIUS-API] Retrieved fallback home info from database`)
          // #region agent log
          fetch('http://127.0.0.1:7243/ingest/e12938fe-54af-4ca0-be48-847cb3195b05',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/radius/homes/[homeGuid]/prepopulate/route.ts:254',message:'Fallback data retrieved',data:{homeName:fallbackHomeInfo.homeName,phone:fallbackHomeInfo.phone,email:fallbackHomeInfo.email},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H'})}).catch(()=>{});
          // #endregion
        } else {
          // #region agent log
          fetch('http://127.0.0.1:7243/ingest/e12938fe-54af-4ca0-be48-847cb3195b05',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/radius/homes/[homeGuid]/prepopulate/route.ts:287',message:'Fallback home query returned no results',data:{homeGuid,resultCount:fallbackResult?.length||0},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H'})}).catch(()=>{});
          // #endregion
        }

        // Also fetch license data from database if license API failed
        if (!licenseData) {
          try {
            const licenseFallbackQuery = `
              SELECT TOP 1
                lc.LicenseType,
                lc.LicenseEffective,
                lc.LicenseExpiration,
                lc.TotalCapacity,
                lc.OpenBeds,
                lc.FilledBeds,
                lc.OriginallyLicensed,
                lc.RespiteOnly,
                lc.LegacyDFPSLevel
              FROM syncLicenseCurrent lc
              WHERE lc.FacilityGUID = @param0
                AND lc.IsActive = 1
            `
            const licenseFallbackResult = await query(licenseFallbackQuery, [homeGuid])
            if (licenseFallbackResult && licenseFallbackResult.length > 0) {
              const lc = licenseFallbackResult[0]
              fallbackLicenseInfo = {
                licenseType: lc.LicenseType || null,
                licenseEffectiveDate: lc.LicenseEffective ? new Date(lc.LicenseEffective).toISOString().split('T')[0] : null,
                licenseExpirationDate: lc.LicenseExpiration ? new Date(lc.LicenseExpiration).toISOString().split('T')[0] : null,
                totalCapacity: lc.TotalCapacity || null,
                fosterCareCapacity: lc.TotalCapacity || null, // Use same as total capacity
                currentCensus: lc.FilledBeds || 0,
                originallyLicensed: lc.OriginallyLicensed ? new Date(lc.OriginallyLicensed).toISOString().split('T')[0] : null,
                respiteOnly: lc.RespiteOnly || false,
                serviceLevelsApproved: lc.LegacyDFPSLevel ? [lc.LegacyDFPSLevel] : [],
              }
              console.log(`✅ [RADIUS-API] Retrieved fallback license info from database`)
              // #region agent log
              fetch('http://127.0.0.1:7243/ingest/e12938fe-54af-4ca0-be48-847cb3195b05',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/radius/homes/[homeGuid]/prepopulate/route.ts:310',message:'Fallback license data retrieved',data:{licenseType:fallbackLicenseInfo.licenseType,licenseEffectiveDate:fallbackLicenseInfo.licenseEffectiveDate,totalCapacity:fallbackLicenseInfo.totalCapacity},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H'})}).catch(()=>{});
              // #endregion
            }
          } catch (licenseFallbackError) {
            console.error(`❌ [RADIUS-API] License database fallback failed:`, licenseFallbackError)
          }
        }
      } catch (fallbackError) {
        console.error(`❌ [RADIUS-API] Database fallback also failed:`, fallbackError)
      }
    }

    // 10. Extract home information from API responses or fallback
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/e12938fe-54af-4ca0-be48-847cb3195b05',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/radius/homes/[homeGuid]/prepopulate/route.ts:275',message:'Home data extraction - before fallback',data:{hasHomeInfo:!!homeInfo,homeInfoName:homeInfo?.homeName,hasLicenseData:!!licenseData,licenseDataName:licenseData?.homeName,hasFallback:!!fallbackHomeInfo,fallbackName:fallbackHomeInfo?.homeName},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
    // #endregion
    const homeName = homeInfo?.homeName || licenseData?.homeName || fallbackHomeInfo?.homeName || "Unknown Home"
    const address = homeInfo?.address || fallbackHomeInfo?.address || {
      street: "",
      street2: null,
      city: "",
      state: "",
      zip: "",
      county: null,
    }
    const homePhone = homeInfo?.phone || fallbackHomeInfo?.phone || null
    const homeEmail = homeInfo?.primaryEmail || homeInfo?.email || fallbackHomeInfo?.email || null
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/e12938fe-54af-4ca0-be48-847cb3195b05',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/radius/homes/[homeGuid]/prepopulate/route.ts:285',message:'Home data extraction - final values',data:{homeName,homePhone,homeEmail,hasAddress:!!address,addressStreet:address?.street},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
    // #endregion

    // 11. Extract T3C credentials from license data (already provided by license-combined endpoint)
    const t3cCredentials = licenseData?.t3cCredentials || {
      hasT3C: false,
      isCompliant: false,
      isAuthorized: false,
    }

    // 12. Extract legacy license information from API response or fallback
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/e12938fe-54af-4ca0-be48-847cb3195b05',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/radius/homes/[homeGuid]/prepopulate/route.ts:325',message:'License data extraction',data:{hasLicenseData:!!licenseData,hasLegacyLicense:!!licenseData?.legacyLicense,hasFallbackLicense:!!fallbackLicenseInfo,licenseType:licenseData?.legacyLicense?.licenseType||fallbackLicenseInfo?.licenseType},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'G'})}).catch(()=>{});
    // #endregion
    const legacyLicenseInfo = licenseData?.legacyLicense || fallbackLicenseInfo || {
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
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/e12938fe-54af-4ca0-be48-847cb3195b05',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/radius/homes/[homeGuid]/prepopulate/route.ts:306',message:'License data extraction - final legacyLicenseInfo',data:{licenseType:legacyLicenseInfo.licenseType,licenseEffectiveDate:legacyLicenseInfo.licenseEffectiveDate,totalCapacity:legacyLicenseInfo.totalCapacity},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'G'})}).catch(()=>{});
    // #endregion

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
