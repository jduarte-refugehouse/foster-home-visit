import { NextResponse, type NextRequest } from "next/server"
import { query } from "@/lib/db"

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

    return NextResponse.json({
      success: true,
      visitForm: {
        ...form,
        // Parse JSON fields
        visit_info: form.visit_info ? JSON.parse(form.visit_info) : null,
        family_info: form.family_info ? JSON.parse(form.family_info) : null,
        attendees: form.attendees ? JSON.parse(form.attendees) : null,
        observations: form.observations ? JSON.parse(form.observations) : null,
        recommendations: form.recommendations ? JSON.parse(form.recommendations) : null,
        signatures: form.signatures ? JSON.parse(form.signatures) : null,
        home_environment: form.home_environment ? JSON.parse(form.home_environment) : null,
        child_interviews: form.child_interviews ? JSON.parse(form.child_interviews) : null,
        parent_interviews: form.parent_interviews ? JSON.parse(form.parent_interviews) : null,
        compliance_review: form.compliance_review ? JSON.parse(form.compliance_review) : null,
        // Ensure consistent date formatting
        created_at: new Date(form.created_at).toISOString(),
        updated_at: new Date(form.updated_at).toISOString(),
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

    // Check if visit form exists
    const existingForm = await query(
      "SELECT visit_form_id FROM visit_forms WHERE visit_form_id = @param0 AND is_deleted = 0",
      [visitFormId],
    )

    if (existingForm.length === 0) {
      return NextResponse.json({ error: "Visit form not found" }, { status: 404 })
    }

    console.log(`📝 [API] Updating visit form: ${visitFormId}`)

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
        auto_save_count = ${isAutoSave ? "auto_save_count + 1" : "auto_save_count"}
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
      ],
    )

    console.log(`✅ [API] Updated visit form: ${visitFormId}`)

    return NextResponse.json({
      success: true,
      visitFormId,
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
