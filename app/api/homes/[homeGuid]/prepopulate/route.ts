import { NextResponse } from "next/server"
import { query } from "@refugehouse/shared-core/db"
import { shouldUseRadiusApiClient, throwIfDirectDbNotAllowed } from "@/lib/microservice-config"
import { radiusApiClient } from "@refugehouse/radius-api-client"

export const dynamic = "force-dynamic"

/**
 * GET /api/homes/[homeGuid]/prepopulate
 * 
 * This endpoint queries multiple specialized tables for prepopulating visit forms.
 * 
 * NOTE: Even though this is microservice-specific business logic, it still needs to go through
 * the API Hub because direct DB access is not available after static IP removal.
 * 
 * TODO: Create API Hub endpoint for home prepopulation data.
 */
export async function GET(request: Request, { params }: { params: { homeGuid: string } }) {
  try {
    const useApiClient = shouldUseRadiusApiClient()
    
    if (useApiClient) {
      // Use API client to fetch home prepopulation data
      const { homeGuid } = params
      try {
        console.log(`🔍 [API] Fetching prepopulation data via API Hub for home: ${homeGuid}`)
        const data = await radiusApiClient.getHomePrepopulationData(homeGuid)
        console.log(`✅ [API] Prepopulation data received from API Hub`)
        return NextResponse.json(data)
      } catch (apiError: any) {
        console.error(`❌ [API] Error fetching prepopulation data from API Hub:`, apiError)
        console.error(`❌ [API] API error details:`, {
          message: apiError?.message,
          status: apiError?.status,
          statusText: apiError?.statusText,
          response: apiError?.response,
          stack: apiError?.stack,
        })
        return NextResponse.json(
          {
            success: false,
            error: "Failed to fetch prepopulation data from API Hub",
            details: apiError?.message || "Unknown error",
            status: apiError?.status,
          },
          { status: apiError?.status || 500 }
        )
      }
    }
    
    // Direct DB access for admin microservice
    throwIfDirectDbNotAllowed("homes prepopulate endpoint")
    const { homeGuid } = params
    console.log(`📋 [API] Fetching pre-population data for home: ${homeGuid}`)

    // 1. Get home/license info from syncLicenseCurrent
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

    // 2. Get household members from syncCurrentFosterFacility
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

    // 3. Get children in placement from syncChildrenInPlacement
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

    // 4. Get previous visit data for carry-forward (most recent completed visit)
    // Join with appointments to find visits for this home
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
      console.log("📋 [API] No previous visit data found (this is normal for first visits)")
    }

    // 5. Prepare response data
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
          effective: home.LicenseEffective || home.LicenseLastUpdated, // Use LicenseLastUpdated if LicenseEffective is null
          expiration: home.LicenseExpiration,
          capacity: home.TotalCapacity,
          ageMin: home.AgeMin,
          ageMax: home.AgeMax,
          openBeds: home.OpenBeds,
          filledBeds: home.FilledBeds,
          originallyLicensed: home.OriginallyLicensed,
          lastUpdated: home.LicenseLastUpdated || home.LicenseEffective, // LicenseLastUpdated and LicenseEffective are the same
        },
        serviceLevels: (() => {
          // Legacy DFPS levels: Basic > Moderate > Specialized > Intense
          // If they have a higher level, they have all levels below it
          const levels: string[] = []
          const legacyLevel = home.LegacyDFPSLevel?.toLowerCase() || ''
          
          // Basic is always included
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

    console.log(`✅ [API] Pre-population data prepared for ${home.HomeName}`)
    console.log(`   - ${prepopulationData.household.providers.length} providers`)
    console.log(`   - ${prepopulationData.household.biologicalChildren.length} biological children`)
    console.log(`   - ${prepopulationData.placements.length} children in placement`)
    console.log(`   - Previous visit: ${previousVisit ? 'Found' : 'None'}`)

    return NextResponse.json(prepopulationData)

  } catch (error: any) {
    console.error("❌ [API] Error fetching pre-population data:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch home data",
        details: error.message,
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

