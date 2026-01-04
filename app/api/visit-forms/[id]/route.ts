import { NextResponse, type NextRequest } from "next/server"
import { query } from "@refugehouse/shared-core/db"
import { resolveUserIdentity, getActorFields } from "@/lib/identity-resolver"
import { shouldUseRadiusApiClient } from "@/lib/microservice-config"
import { radiusApiClient } from "@refugehouse/radius-api-client"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

// GET - Fetch specific visit form by ID
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const visitFormId = params.id
    console.log(`🔍 [API] Fetching visit form: ${visitFormId}`)

    const visitForms = await query(
      `
      SELECT 
        vf.visit_form_id,
        vf.appointment_id,
        vf.form_type,
        vf.form_version,
        vf.status,
        vf.visit_date,
        vf.visit_time,
        vf.visit_number,
        vf.quarter,
        vf.visit_variant,
        vf.visit_info,
        vf.family_info,
        vf.attendees,
        vf.observations,
        vf.recommendations,
        vf.signatures,
        vf.home_environment,
        vf.child_interviews,
        vf.parent_interviews,
        vf.compliance_review,
        vf.last_auto_save,
        vf.auto_save_count,
        vf.created_at,
        vf.updated_at,
        vf.created_by_user_id,
        vf.created_by_name,
        vf.updated_by_user_id,
        vf.updated_by_name,
        vf.current_session_id,
        vf.current_session_last_save,
        vf.current_session_save_type,
        vf.current_session_user_id,
        vf.current_session_user_name,
        vf.save_history_json,
        -- Include appointment details
        a.title as appointment_title,
        a.home_name,
        a.location_address,
        a.assigned_to_name,
        a.assigned_to_role
      FROM visit_forms vf
      LEFT JOIN appointments a ON vf.appointment_id = a.appointment_id
      WHERE vf.visit_form_id = @param0 AND vf.is_deleted = 0
    `,
      [visitFormId],
    )

    if (visitForms.length === 0) {
      return NextResponse.json({ error: "Visit form not found" }, { status: 404 })
    }

    const form = visitForms[0]

    console.log(`✅ [API] Retrieved visit form: ${visitFormId}`)

    // Helper function to safely parse JSON fields
    const safeParseJSON = (value: any) => {
      if (!value) return null
      if (typeof value === 'string') {
        try {
          return JSON.parse(value)
        } catch (e) {
          console.warn(`⚠️ [API] Failed to parse JSON field:`, e)
          return value // Return as-is if parsing fails
        }
      }
      // If it's already an object, return it
      return value
    }

    return NextResponse.json({
      success: true,
      visitForm: {
        ...form,
        // Parse JSON fields safely
        visit_info: safeParseJSON(form.visit_info),
        family_info: safeParseJSON(form.family_info),
        attendees: safeParseJSON(form.attendees),
        observations: safeParseJSON(form.observations),
        recommendations: safeParseJSON(form.recommendations),
        signatures: safeParseJSON(form.signatures),
        home_environment: safeParseJSON(form.home_environment),
        child_interviews: safeParseJSON(form.child_interviews),
        parent_interviews: safeParseJSON(form.parent_interviews),
        compliance_review: safeParseJSON(form.compliance_review),
        // Ensure consistent date formatting
        created_at: form.created_at ? new Date(form.created_at).toISOString() : null,
        updated_at: form.updated_at ? new Date(form.updated_at).toISOString() : null,
        last_auto_save: form.last_auto_save ? new Date(form.last_auto_save).toISOString() : null,
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("❌ [API] Error fetching visit form:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch visit form",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

// PUT - Update existing visit form
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const visitFormId = params.id
    const body = await request.json()
    const {
      status,
      visitDate,
      visitTime,
      visitNumber,
      quarter,
      visitVariant,
      visitInfo,
      familyInfo,
      attendees,
      observations,
      recommendations,
      signatures,
      homeEnvironment,
      childInterviews,
      parentInterviews,
      complianceReview,
      updatedByUserId,
      updatedByName,
      isAutoSave = false,
    } = body

    // Get existing form to check status change and get appointment data
    const existingForm = await query(
      `SELECT 
        visit_form_id, 
        status as current_status,
        appointment_id,
        visit_date,
        visit_time
      FROM visit_forms 
      WHERE visit_form_id = @param0 AND is_deleted = 0`,
      [visitFormId],
    )

    if (existingForm.length === 0) {
      return NextResponse.json({ error: "Visit form not found" }, { status: 404 })
    }

    const currentStatus = existingForm[0].current_status
    const appointmentId = existingForm[0].appointment_id
    const isStatusChangingToCompleted = currentStatus === "draft" && status === "completed"

    console.log(`📝 [API] Updating visit form: ${visitFormId}`, {
      currentStatus,
      newStatus: status,
      isStatusChangingToCompleted
    })

    // Resolve user identity and get appointment data if status is changing to completed
    let identity = null
    let actorFields = null
    let homeGuid: string | null = null
    let homeName: string | null = null
    let homeXref: number | null = null
    let continuumMarkId: string | null = null

    if (isStatusChangingToCompleted && updatedByUserId) {
      try {
        // Resolve user identity
        if (updatedByUserId && updatedByUserId !== "system-user" && !updatedByUserId.startsWith("temp-")) {
          try {
            console.log("🔍 [API] Resolving user identity for:", updatedByUserId)
            identity = await resolveUserIdentity(updatedByUserId)
            actorFields = getActorFields(identity)
            console.log("✅ [API] User identity resolved:", {
              radiusGuid: identity.radiusGuid,
              entityGuid: identity.entityGuid,
              userType: identity.userType,
              unit: identity.unit
            })
          } catch (identityResolveError) {
            console.error("⚠️ [API] Failed to resolve user identity (non-blocking):", identityResolveError)
            identity = null
            actorFields = null
          }
        }

        // Get appointment data to find home GUID
        if (appointmentId) {
          try {
            const appointmentData = await query(
              `SELECT a.home_xref, h.HomeName, h.Guid as HomeGUID
               FROM appointments a
               LEFT JOIN SyncActiveHomes h ON a.home_xref = h.Xref
               WHERE a.appointment_id = @param0 AND a.is_deleted = 0`,
              [appointmentId]
            )

            if (appointmentData.length > 0) {
              homeXref = appointmentData[0].home_xref
              homeName = appointmentData[0].HomeName
              homeGuid = appointmentData[0].HomeGUID
              console.log("✅ [API] Appointment data retrieved:", { homeXref, homeName, homeGuid })
            }
          } catch (appointmentError) {
            console.error("⚠️ [API] Failed to fetch appointment data (non-blocking):", appointmentError)
          }
        }
      } catch (error) {
        console.error("⚠️ [API] Unexpected error in identity/appointment resolution (non-blocking):", error)
      }

      // Create ContinuumMark via API Hub if we have all required data
      const useApiClient = shouldUseRadiusApiClient()
      if (useApiClient && identity && actorFields && homeGuid) {
        try {
          console.log("🔄 [API] Creating ContinuumMark via API Hub (status changed to completed)...")
          
          // Extract child GUIDs from form data if available
          const childGuids: Array<{ guid: string; name?: string }> = []
          if (familyInfo?.placements) {
            const placements = Array.isArray(familyInfo.placements) 
              ? familyInfo.placements 
              : Object.values(familyInfo.placements || {})
            placements.forEach((placement: any) => {
              if (placement?.childGuid || placement?.child_guid) {
                childGuids.push({
                  guid: placement.childGuid || placement.child_guid,
                  name: placement.childName || placement.child_name || null
                })
              }
            })
          }

          // Extract parties from attendees
          const parties: Array<{
            name: string
            role?: string
            entityGuid?: string | null
            type?: string
          }> = []
          if (attendees?.list) {
            const attendeeList = Array.isArray(attendees.list) ? attendees.list : Object.values(attendees.list)
            attendeeList.forEach((attendee: any) => {
              if (attendee?.name) {
                parties.push({
                  name: attendee.name,
                  role: "PRESENT",
                  entityGuid: attendee.entityGuid || attendee.entity_guid || null,
                  type: attendee.type || "unknown"
                })
              }
            })
          }

          const markDate = visitDate && visitTime 
            ? `${visitDate}T${visitTime}:00`
            : existingForm[0].visit_date && existingForm[0].visit_time
            ? `${existingForm[0].visit_date}T${existingForm[0].visit_time}:00`
            : new Date().toISOString()

          const visitResult = await radiusApiClient.createVisit({
            markDate,
            markType: "HOME_VISIT",
            fosterHomeGuid: homeGuid,
            fosterHomeName: homeName || undefined,
            fosterHomeXref: homeXref || undefined,
            childGuids,
            notes: observations?.observations || recommendations?.visitSummary || null,
            jsonPayload: {
              visitFormId: visitFormId,
              visitInfo,
              familyInfo,
              attendees,
              observations,
              recommendations,
              homeEnvironment,
              childInterviews,
              parentInterviews,
              complianceReview,
              signatures
            },
            unit: identity.unit || "DAL",
            sourceSystem: "VisitService",
            ...actorFields,
            parties
          })

          continuumMarkId = visitResult.markId
          console.log("✅ [API] ContinuumMark created:", continuumMarkId)
        } catch (markError) {
          console.error("⚠️ [API] Failed to create ContinuumMark (non-blocking):", markError)
          // Don't fail the entire request if ContinuumMark creation fails
        }
      }
    }

    // Update visit form with actor fields if available
    await query(
      `
      UPDATE visit_forms SET
        status = @param1,
        visit_date = @param2,
        visit_time = @param3,
        visit_number = @param4,
        quarter = @param5,
        visit_variant = @param6,
        visit_info = @param7,
        family_info = @param8,
        attendees = @param9,
        observations = @param10,
        recommendations = @param11,
        signatures = @param12,
        home_environment = @param13,
        child_interviews = @param14,
        parent_interviews = @param15,
        compliance_review = @param16,
        updated_at = GETUTCDATE(),
        updated_by_user_id = @param17,
        updated_by_name = @param18,
        last_auto_save = ${isAutoSave ? "GETUTCDATE()" : "last_auto_save"},
        auto_save_count = ${isAutoSave ? "auto_save_count + 1" : "auto_save_count"},
        actor_radius_guid = @param19,
        actor_entity_guid = @param20,
        actor_user_type = @param21
      WHERE visit_form_id = @param0 AND is_deleted = 0
    `,
      [
        visitFormId,
        status,
        visitDate ? new Date(visitDate) : null,
        visitTime,
        visitNumber,
        quarter,
        visitVariant,
        visitInfo ? JSON.stringify(visitInfo) : null,
        familyInfo ? JSON.stringify(familyInfo) : null,
        attendees ? JSON.stringify(attendees) : null,
        observations ? JSON.stringify(observations) : null,
        recommendations ? JSON.stringify(recommendations) : null,
        signatures ? JSON.stringify(signatures) : null,
        homeEnvironment ? JSON.stringify(homeEnvironment) : null,
        childInterviews ? JSON.stringify(childInterviews) : null,
        parentInterviews ? JSON.stringify(parentInterviews) : null,
        complianceReview ? JSON.stringify(complianceReview) : null,
        updatedByUserId,
        updatedByName,
        actorFields?.actorRadiusGuid || null,
        actorFields?.actorEntityGuid || null,
        actorFields?.actorUserType || null,
      ],
    )

    console.log(`✅ [API] Updated visit form: ${visitFormId}`)

    return NextResponse.json({
      success: true,
      visitFormId,
      continuumMarkId: continuumMarkId || undefined,
      message: isAutoSave ? "Form auto-saved successfully" : "Visit form updated successfully",
      isAutoSave,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("❌ [API] Error updating visit form:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update visit form",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

// DELETE - Soft delete visit form
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const visitFormId = params.id
    const body = await request.json()
    const { deletedByUserId, deletedByName } = body

    // Check if visit form exists
    const existingForm = await query(
      "SELECT visit_form_id FROM visit_forms WHERE visit_form_id = @param0 AND is_deleted = 0",
      [visitFormId],
    )

    if (existingForm.length === 0) {
      return NextResponse.json({ error: "Visit form not found" }, { status: 404 })
    }

    console.log(`🗑️ [API] Soft deleting visit form: ${visitFormId}`)

    await query(
      `
      UPDATE visit_forms SET
        is_deleted = 1,
        deleted_at = GETUTCDATE(),
        deleted_by_user_id = @param1,
        deleted_by_name = @param2,
        updated_at = GETUTCDATE()
      WHERE visit_form_id = @param0
    `,
      [visitFormId, deletedByUserId, deletedByName],
    )

    console.log(`✅ [API] Soft deleted visit form: ${visitFormId}`)

    return NextResponse.json({
      success: true,
      visitFormId,
      message: "Visit form deleted successfully",
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("❌ [API] Error deleting visit form:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete visit form",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
