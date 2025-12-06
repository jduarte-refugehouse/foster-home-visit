import { NextResponse, type NextRequest } from "next/server"
import { query } from "@refugehouse/shared-core/db"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"
export const maxDuration = 60 // Vercel function timeout in seconds (Pro plan: max 60s, Enterprise: max 900s)

// GET - Fetch visit forms with optional filtering
export async function GET(request: NextRequest) {
  try {
    console.log("🔍 [API] Fetching visit forms")

    const { searchParams } = request.nextUrl
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
        vf.current_session_id,
        vf.current_session_last_save,
        vf.current_session_save_type,
        vf.current_session_user_id,
        vf.current_session_user_name,
        vf.save_history_json,
        -- Include appointment details
        a.title as appointment_title,
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
    console.log("🔄 [API] Starting visit form save process")

    const body = await request.json()
    console.log("📝 [API] Request body received:", {
      appointmentId: body.appointmentId,
      status: body.status,
      visitDate: body.visitDate,
      visitTime: body.visitTime,
      isAutoSave: body.isAutoSave,
    })

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
      // Session tracking
      currentSessionId,
      currentSessionUserId,
      currentSessionUserName,
    } = body

    console.log("🔍 [API] Validating required fields...")
    if (!appointmentId || !visitDate || !visitTime || !createdByUserId || !createdByName) {
      const missingFields = []
      if (!appointmentId) missingFields.push("appointmentId")
      if (!visitDate) missingFields.push("visitDate")
      if (!visitTime) missingFields.push("visitTime")
      if (!createdByUserId) missingFields.push("createdByUserId")
      if (!createdByName) missingFields.push("createdByName")

      console.error("❌ [API] Missing required fields:", missingFields)
      return NextResponse.json({ error: `Missing required fields: ${missingFields.join(", ")}` }, { status: 400 })
    }

    let parsedVisitDate
    try {
      parsedVisitDate = new Date(visitDate)
      if (isNaN(parsedVisitDate.getTime())) {
        throw new Error("Invalid date format")
      }
      console.log("📅 [API] Visit date parsed successfully:", parsedVisitDate.toISOString())
    } catch (dateError) {
      console.error("❌ [API] Date parsing error:", dateError)
      return NextResponse.json({ error: `Invalid visit date format: ${visitDate}` }, { status: 400 })
    }

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

    const serializedFields = {}
    for (const [key, value] of Object.entries(jsonFields)) {
      if (value !== null && value !== undefined) {
        try {
          serializedFields[key] = JSON.stringify(value)
          console.log(`✅ [API] Serialized ${key} successfully`)
        } catch (jsonError) {
          console.error(`❌ [API] JSON serialization error for ${key}:`, jsonError)
          return NextResponse.json({ error: `Invalid JSON data in field: ${key}` }, { status: 400 })
        }
      } else {
        serializedFields[key] = null
      }
    }

    console.log("🔍 [API] Checking if appointment exists...")
    // Check if appointment exists
    const appointmentExists = await query(
      "SELECT COUNT(*) as count FROM dbo.appointments WHERE appointment_id = @param0 AND is_deleted = 0",
      [appointmentId],
    )

    if (appointmentExists[0].count === 0) {
      console.error("❌ [API] Appointment not found:", appointmentId)
      return NextResponse.json({ error: "Appointment not found" }, { status: 404 })
    }
    console.log("✅ [API] Appointment exists")

    console.log("🔍 [API] Checking for existing visit form...")
    // Check if visit form already exists for this appointment
    const existingForm = await query(
      "SELECT visit_form_id, current_session_id, current_session_last_save, current_session_save_type, current_session_user_id, current_session_user_name, save_history_json FROM dbo.visit_forms WHERE appointment_id = @param0 AND is_deleted = 0",
      [appointmentId],
    )

    if (existingForm.length > 0) {
      // Update existing form
      const visitFormId = existingForm[0].visit_form_id
      const previousSessionId = existingForm[0].current_session_id
      const previousSessionLastSave = existingForm[0].current_session_last_save
      const previousSessionSaveType = existingForm[0].current_session_save_type
      const previousSessionUserId = existingForm[0].current_session_user_id
      const previousSessionUserName = existingForm[0].current_session_user_name
      const existingHistory = existingForm[0].save_history_json ? JSON.parse(existingForm[0].save_history_json) : []
      
      console.log("🔄 [API] Updating existing form:", visitFormId)
      console.log("🆔 [SESSION] Previous session:", previousSessionId, "Current session:", currentSessionId)

      // If this is a new session, commit previous session's save to history
      let updatedHistory = existingHistory
      if (previousSessionId && currentSessionId && previousSessionId !== currentSessionId && previousSessionLastSave) {
        console.log("📝 [SESSION] Committing previous session to history")
        const historyEntry = {
          sessionId: previousSessionId,
          lastSave: previousSessionLastSave,
          saveType: previousSessionSaveType || "manual",
          userId: previousSessionUserId || createdByUserId,
          userName: previousSessionUserName || createdByName,
        }
        updatedHistory = [...existingHistory, historyEntry]
        console.log("📚 [SESSION] Updated history:", updatedHistory)
      }

      // Determine save type
      const saveType = isAutoSave ? "auto" : "manual"

      try {
        await query(
          `
          UPDATE dbo.visit_forms SET
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
            current_session_id = @param19,
            current_session_last_save = GETUTCDATE(),
            current_session_save_type = @param20,
            current_session_user_id = @param21,
            current_session_user_name = @param22,
            save_history_json = @param23
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
            createdByUserId,
            createdByName,
            currentSessionId || null,
            saveType,
            currentSessionUserId || createdByUserId,
            currentSessionUserName || createdByName,
            JSON.stringify(updatedHistory),
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
      } catch (updateError) {
        console.error("❌ [API] Update query failed:", updateError)
        throw updateError
      }
    } else {
      // Create new form
      console.log("➕ [API] Creating new visit form...")

      try {
        // Determine save type for new form
        const saveType = isAutoSave ? "auto" : "manual"

        const result = await query(
          `
          INSERT INTO dbo.visit_forms (
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
            current_session_id,
            current_session_last_save,
            current_session_save_type,
            current_session_user_id,
            current_session_user_name,
            save_history_json,
            created_at,
            updated_at
          )
          OUTPUT INSERTED.visit_form_id, INSERTED.created_at
          VALUES (
            @param0, @param1, @param2, @param3, @param4, @param5,
            @param6, @param7, @param8, @param9, @param10, @param11,
            @param12, @param13, @param14, @param15, @param16, @param17,
            @param18, @param19, @param20, @param21, @param22, @param23,
            @param24, @param25, @param26, @param27, @param28,
            GETUTCDATE(), GETUTCDATE()
          )
        `,
          [
            appointmentId, // @param0
            formType, // @param1
            formVersion, // @param2
            status, // @param3
            parsedVisitDate, // @param4
            visitTime, // @param5
            visitNumber, // @param6
            quarter, // @param7
            visitVariant, // @param8
            serializedFields.visitInfo, // @param9
            serializedFields.familyInfo, // @param10
            serializedFields.attendees, // @param11
            serializedFields.observations, // @param12
            serializedFields.recommendations, // @param13
            serializedFields.signatures, // @param14
            serializedFields.homeEnvironment, // @param15
            serializedFields.childInterviews, // @param16
            serializedFields.parentInterviews, // @param17
            serializedFields.complianceReview, // @param18
            createdByUserId, // @param19
            createdByName, // @param20
            isAutoSave ? new Date() : null, // @param21 last_auto_save
            isAutoSave ? 1 : 0, // @param22 auto_save_count
            currentSessionId || null, // @param23 current_session_id
            new Date(), // @param24 current_session_last_save
            saveType, // @param25 current_session_save_type
            currentSessionUserId || createdByUserId, // @param26 current_session_user_id
            currentSessionUserName || createdByName, // @param27 current_session_user_name
            "[]", // @param28 save_history_json (empty array for new form)
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
      } catch (insertError) {
        console.error("❌ [API] Insert query failed:", insertError)
        throw insertError
      }
    }
  } catch (error) {
    console.error("❌ [API] Error saving visit form:", {
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined,
      error: error,
    })

    return NextResponse.json(
      {
        success: false,
        error: "Failed to save visit form",
        details: error instanceof Error ? error.message : "Unknown error",
        errorType: error instanceof Error ? error.name : "UnknownError",
      },
      { status: 500 },
    )
  }
}
