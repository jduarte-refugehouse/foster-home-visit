import { NextRequest, NextResponse } from "next/server"
import { validateApiKey } from "@/lib/api-auth"
import { query } from "@refugehouse/shared-core/db"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"
export const maxDuration = 60

/**
 * GET /api/radius/visit-forms/[id]
 * 
 * Get a specific visit form by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    const visitFormId = params.id

    // 2. Query visit form
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
        vf.actor_radius_guid,
        vf.actor_entity_guid,
        vf.actor_user_type,
        a.title as appointment_title,
        a.location_address
      FROM visit_forms vf
      LEFT JOIN appointments a ON vf.appointment_id = a.appointment_id
      WHERE vf.visit_form_id = @param0 AND vf.is_deleted = 0
    `,
      [visitFormId]
    )

    if (visitForms.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Visit form not found",
        },
        { status: 404 }
      )
    }

    const form = visitForms[0]

    // 3. Parse JSON fields safely
    const processedForm = {
      ...form,
      visit_info: form.visit_info ? safeJsonParse(form.visit_info) : null,
      family_info: form.family_info ? safeJsonParse(form.family_info) : null,
      attendees: form.attendees ? safeJsonParse(form.attendees) : null,
      observations: form.observations ? safeJsonParse(form.observations) : null,
      recommendations: form.recommendations ? safeJsonParse(form.recommendations) : null,
      signatures: form.signatures ? safeJsonParse(form.signatures) : null,
      home_environment: form.home_environment ? safeJsonParse(form.home_environment) : null,
      child_interviews: form.child_interviews ? safeJsonParse(form.child_interviews) : null,
      parent_interviews: form.parent_interviews ? safeJsonParse(form.parent_interviews) : null,
      compliance_review: form.compliance_review ? safeJsonParse(form.compliance_review) : null,
      save_history_json: form.save_history_json ? safeJsonParse(form.save_history_json) : null,
    }

    const duration = Date.now() - startTime

    return NextResponse.json({
      success: true,
      visitForm: processedForm,
      timestamp: new Date().toISOString(),
      duration_ms: duration,
    })
  } catch (error) {
    const duration = Date.now() - startTime
    console.error("❌ [RADIUS-API] Error in visit-forms GET [id]:", error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
        timestamp: new Date().toISOString(),
        duration_ms: duration,
      },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/radius/visit-forms/[id]
 * 
 * Update an existing visit form
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
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
      actorRadiusGuid,
      actorEntityGuid,
      actorUserType,
    } = body

    // 2. Check if visit form exists
    const existingForm = await query(
      `SELECT 
        visit_form_id, 
        status as current_status,
        appointment_id,
        visit_date,
        visit_time
      FROM visit_forms 
      WHERE visit_form_id = @param0 AND is_deleted = 0`,
      [visitFormId]
    )

    if (existingForm.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Visit form not found",
        },
        { status: 404 }
      )
    }

    // 3. Serialize JSON fields
    const jsonFields = {
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
    }

    const serializedFields: Record<string, string | null> = {}
    for (const [key, value] of Object.entries(jsonFields)) {
      if (value !== null && value !== undefined) {
        try {
          serializedFields[key] = JSON.stringify(value)
        } catch (jsonError) {
          return NextResponse.json(
            { success: false, error: `Invalid JSON data in field: ${key}` },
            { status: 400 }
          )
        }
      } else {
        serializedFields[key] = null
      }
    }

    // 4. Parse visit date if provided
    let parsedVisitDate: Date | null = null
    if (visitDate) {
      try {
        parsedVisitDate = new Date(visitDate)
        if (isNaN(parsedVisitDate.getTime())) {
          throw new Error("Invalid date format")
        }
      } catch (dateError) {
        return NextResponse.json(
          { success: false, error: `Invalid visit date format: ${visitDate}` },
          { status: 400 }
        )
      }
    }

    // 5. Update visit form
    const saveType = isAutoSave ? "auto" : "manual"

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
        parsedVisitDate,
        visitTime,
        visitNumber,
        quarter,
        visitVariant,
        serializedFields.visitInfo,
        serializedFields.familyInfo,
        serializedFields.attendees,
        serializedFields.observations,
        serializedFields.recommendations,
        serializedFields.signatures,
        serializedFields.homeEnvironment,
        serializedFields.childInterviews,
        serializedFields.parentInterviews,
        serializedFields.complianceReview,
        updatedByUserId,
        updatedByName,
        actorRadiusGuid || null,
        actorEntityGuid || null,
        actorUserType || null,
      ]
    )

    const duration = Date.now() - startTime
    console.log(`✅ [RADIUS-API] Updated visit form ${visitFormId} in ${duration}ms`)

    return NextResponse.json({
      success: true,
      visitFormId,
      message: isAutoSave ? "Form auto-saved successfully" : "Visit form updated successfully",
      isAutoSave,
      timestamp: new Date().toISOString(),
      duration_ms: duration,
    })
  } catch (error) {
    const duration = Date.now() - startTime
    console.error("❌ [RADIUS-API] Error in visit-forms PUT [id]:", error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
        timestamp: new Date().toISOString(),
        duration_ms: duration,
      },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/radius/visit-forms/[id]
 * 
 * Soft delete a visit form
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    const visitFormId = params.id
    const body = await request.json().catch(() => ({}))
    const { deletedByUserId, deletedByName } = body

    // 2. Check if visit form exists
    const existingForm = await query(
      "SELECT visit_form_id FROM visit_forms WHERE visit_form_id = @param0 AND is_deleted = 0",
      [visitFormId]
    )

    if (existingForm.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Visit form not found",
        },
        { status: 404 }
      )
    }

    // 3. Soft delete
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
      [visitFormId, deletedByUserId || null, deletedByName || null]
    )

    const duration = Date.now() - startTime
    console.log(`✅ [RADIUS-API] Soft deleted visit form ${visitFormId} in ${duration}ms`)

    return NextResponse.json({
      success: true,
      visitFormId,
      message: "Visit form deleted successfully",
      timestamp: new Date().toISOString(),
      duration_ms: duration,
    })
  } catch (error) {
    const duration = Date.now() - startTime
    console.error("❌ [RADIUS-API] Error in visit-forms DELETE [id]:", error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
        timestamp: new Date().toISOString(),
        duration_ms: duration,
      },
      { status: 500 }
    )
  }
}

/**
 * Helper function to safely parse JSON
 */
function safeJsonParse(jsonString: string): any {
  try {
    return JSON.parse(jsonString)
  } catch (error) {
    console.warn("⚠️ [RADIUS-API] Failed to parse JSON:", error)
    return null
  }
}

