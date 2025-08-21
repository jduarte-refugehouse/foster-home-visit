import { NextResponse, type NextRequest } from "next/server"
import { query } from "@/lib/db"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

// GET - Fetch visit forms with optional filtering
export async function GET(request: NextRequest) {
  try {
    console.log("🔍 [API] Fetching visit forms")

    const { searchParams } = new URL(request.url)
    const appointmentId = searchParams.get("appointmentId")
    const status = searchParams.get("status")
    const userId = searchParams.get("userId")

    // Build dynamic query based on filters
    const whereConditions = ["vf.is_deleted = 0"]
    const params: any[] = []
    let paramIndex = 0

    if (appointmentId) {
      whereConditions.push(`vf.appointment_id = @param${paramIndex}`)
      params.push(appointmentId)
      paramIndex++
    }

    if (status) {
      whereConditions.push(`vf.status = @param${paramIndex}`)
      params.push(status)
      paramIndex++
    }

    if (userId) {
      whereConditions.push(`vf.created_by_user_id = @param${paramIndex}`)
      params.push(userId)
      paramIndex++
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(" AND ")}` : ""

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
        -- Include appointment details
        a.title as appointment_title,
        a.home_name,
        a.location_address
      FROM visit_forms vf
      LEFT JOIN appointments a ON vf.appointment_id = a.appointment_id
      ${whereClause}
      ORDER BY vf.updated_at DESC
    `,
      params,
    )

    console.log(`✅ [API] Retrieved ${visitForms.length} visit forms`)

    return NextResponse.json({
      success: true,
      count: visitForms.length,
      visitForms: visitForms.map((form) => ({
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
      })),
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("❌ [API] Error fetching visit forms:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch visit forms",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

// POST - Create new visit form or save draft
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      appointmentId,
      formType = "home_visit",
      formVersion = "1.0",
      status = "draft",
      visitDate,
      visitTime,
      visitNumber = 1,
      quarter,
      visitVariant = 1,
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
      createdByUserId,
      createdByName,
      isAutoSave = false,
    } = body

    // Validation
    if (!appointmentId || !visitDate || !visitTime || !createdByUserId || !createdByName) {
      return NextResponse.json(
        { error: "Missing required fields: appointmentId, visitDate, visitTime, createdByUserId, createdByName" },
        { status: 400 },
      )
    }

    // Check if appointment exists
    const appointmentExists = await query(
      "SELECT COUNT(*) as count FROM appointments WHERE appointment_id = @param0 AND is_deleted = 0",
      [appointmentId],
    )

    if (appointmentExists[0].count === 0) {
      return NextResponse.json({ error: "Appointment not found" }, { status: 404 })
    }

    // Check if visit form already exists for this appointment
    const existingForm = await query(
      "SELECT visit_form_id FROM visit_forms WHERE appointment_id = @param0 AND is_deleted = 0",
      [appointmentId],
    )

    if (existingForm.length > 0) {
      // Update existing form
      const visitFormId = existingForm[0].visit_form_id

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
          new Date(visitDate),
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
          createdByUserId,
          createdByName,
        ],
      )

      console.log(`✅ [API] Updated visit form with ID: ${visitFormId}`)

      return NextResponse.json({
        success: true,
        visitFormId,
        message: isAutoSave ? "Form auto-saved successfully" : "Visit form updated successfully",
        isAutoSave,
        timestamp: new Date().toISOString(),
      })
    } else {
      // Create new form
      const result = await query(
        `
        INSERT INTO visit_forms (
          appointment_id,
          form_type,
          form_version,
          status,
          visit_date,
          visit_time,
          visit_number,
          quarter,
          visit_variant,
          visit_info,
          family_info,
          attendees,
          observations,
          recommendations,
          signatures,
          home_environment,
          child_interviews,
          parent_interviews,
          compliance_review,
          created_by_user_id,
          created_by_name,
          last_auto_save,
          auto_save_count,
          created_at,
          updated_at
        )
        OUTPUT INSERTED.visit_form_id, INSERTED.created_at
        VALUES (
          @param0, @param1, @param2, @param3, @param4, @param5,
          @param6, @param7, @param8, @param9, @param10, @param11,
          @param12, @param13, @param14, @param15, @param16, @param17,
          @param18, @param19, @param20, @param21,
          ${isAutoSave ? "GETUTCDATE()" : "NULL"},
          ${isAutoSave ? "1" : "0"},
          GETUTCDATE(), GETUTCDATE()
        )
      `,
        [
          appointmentId,
          formType,
          formVersion,
          status,
          new Date(visitDate),
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
          createdByUserId,
          createdByName,
        ],
      )

      const visitFormId = result[0].visit_form_id
      console.log(`✅ [API] Created visit form with ID: ${visitFormId}`)

      return NextResponse.json(
        {
          success: true,
          visitFormId,
          message: isAutoSave ? "Form auto-saved successfully" : "Visit form created successfully",
          isAutoSave,
          timestamp: new Date().toISOString(),
        },
        { status: 201 },
      )
    }
  } catch (error) {
    console.error("❌ [API] Error saving visit form:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to save visit form",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
