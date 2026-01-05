import { NextRequest, NextResponse } from "next/server"
import { validateApiKey } from "@/lib/api-auth"
import { query } from "@refugehouse/shared-core/db"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

/**
 * GET /api/radius/homes/[homeGuid]/prepopulate
 * 
 * Proxy endpoint for fetching home prepopulation data from RadiusBifrost
 * Requires API key authentication via x-api-key header
 * 
 * Returns comprehensive data for prepopulating visit forms including:
 * - Home/license information
 * - Household members
 * - Children in placement
 * - Previous visit data
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
    console.log(`📋 [RADIUS-API] Fetching pre-population data for home: ${homeGuid}`)

    // 2. Get home/license info from syncLicenseCurrent
    const homeInfoQuery = `
      SELECT TOP 1
        lc.HomeName,
        lc.Address1,
        lc.Address2,
        lc.City,
        lc.State,
        lc.Zip,
        lc.County,
        lc.CaseManagerName,
        lc.CaseManagerEmail,
        lc.LicenseID,
        lc.LicenseEffective,
        lc.LicenseExpiration,
        lc.LicenseType,
        lc.TotalCapacity,
        lc.AgeMin,
        lc.AgeMax,
        lc.OpenBeds,
        lc.FilledBeds,
        lc.LegacyDFPSLevel,
        lc.OriginallyLicensed,
        lc.LicenseLastUpdated,
        ah.HomePhone,
        ah.CaregiverEmail
      FROM syncLicenseCurrent lc
      LEFT JOIN syncActiveHomes ah ON lc.FacilityGUID = ah.Guid
      WHERE lc.FacilityGUID = @param0
        AND lc.IsActive = 1
    `

    const homeInfo = await query(homeInfoQuery, [homeGuid])

    if (!homeInfo || homeInfo.length === 0) {
      return NextResponse.json(
        { success: false, error: "Home not found" },
        { status: 404 }
      )
    }

    const home = homeInfo[0]

    // 3. Get household members from syncCurrentFosterFacility
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

    // 4. Get children in placement from syncChildrenInPlacement
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

    // 5. Get previous visit data for carry-forward (most recent completed visit)
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

    // 6. Prepare response data
    const prepopulationData = {
      success: true,
      home: {
        guid: homeGuid,
        name: home.HomeName,
        address: {
          street: home.Address1,
          street2: home.Address2,
          city: home.City,
          state: home.State,
          zip: home.Zip,
          county: home.County,
        },
        phone: home.HomePhone,
        email: home.CaregiverEmail,
        caseManager: {
          name: home.CaseManagerName,
          email: home.CaseManagerEmail,
        },
        license: {
          id: home.LicenseID,
          type: home.LicenseType,
          effective: home.LicenseEffective || home.LicenseLastUpdated,
          expiration: home.LicenseExpiration,
          capacity: home.TotalCapacity,
          ageMin: home.AgeMin,
          ageMax: home.AgeMax,
          openBeds: home.OpenBeds,
          filledBeds: home.FilledBeds,
          originallyLicensed: home.OriginallyLicensed,
          lastUpdated: home.LicenseLastUpdated || home.LicenseEffective,
        },
        serviceLevels: (() => {
          const levels: string[] = []
          const legacyLevel = home.LegacyDFPSLevel?.toLowerCase() || ''
          
          levels.push('basic')
          
          if (legacyLevel === 'moderate' || legacyLevel === 'specialized' || legacyLevel === 'intense') {
            levels.push('moderate')
          }
          
          if (legacyLevel === 'specialized' || legacyLevel === 'intense') {
            levels.push('specialized')
          }
          
          if (legacyLevel === 'intense') {
            levels.push('intense')
          }
          
          return levels
        })(),
      },
      household: {
        providers: householdMembers
          .filter(m => m.Relationship === 'Provider' || m.Relationship === 'Primary Caregiver')
          .map(m => ({
            guid: m.PersonGUID,
            name: m.RelationName,
            age: m.CurrentAge,
            relationship: m.Relationship,
          })),
        biologicalChildren: householdMembers
          .filter(m => m.Relationship === 'Biological Child Resident')
          .map(m => ({
            guid: m.PersonGUID,
            name: m.RelationName,
            age: m.CurrentAge,
          })),
        otherHouseholdMembers: householdMembers
          .filter(m => 
            m.Relationship !== 'Provider' && 
            m.Relationship !== 'Primary Caregiver' &&
            m.Relationship !== 'Biological Child Resident' &&
            m.Relationship !== 'Foster Placement'
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
      previousVisit: previousVisit ? {
        visitId: previousVisit.visit_form_id,
        visitDate: previousVisit.visit_date,
        formType: previousVisit.form_type,
        visitInfo: previousVisit.visit_info,
        familyInfo: previousVisit.family_info,
        homeEnvironment: previousVisit.home_environment,
        observations: previousVisit.observations,
        recommendations: previousVisit.recommendations,
        complianceReview: previousVisit.compliance_review,
      } : null,
    }

    const duration = Date.now() - startTime
    console.log(`✅ [RADIUS-API] Pre-population data prepared for ${home.HomeName} in ${duration}ms`)
    console.log(`   - ${prepopulationData.household.providers.length} providers`)
    console.log(`   - ${prepopulationData.household.biologicalChildren.length} biological children`)
    console.log(`   - ${prepopulationData.placements.length} children in placement`)
    console.log(`   - Previous visit: ${previousVisit ? 'Found' : 'None'}`)

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

