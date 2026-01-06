import { NextRequest, NextResponse } from "next/server"
import { validateApiKey } from "@/lib/api-auth"
import { query } from "@refugehouse/shared-core/db"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"
export const maxDuration = 60

/**
 * GET /api/radius/visit-forms
 * 
 * Proxy endpoint for accessing visit form data from RadiusBifrost
 * Requires API key authentication via x-api-key header
 * 
 * Query Parameters:
 * - appointmentId: Filter by appointment ID (optional)
 * - status: Filter by status (optional)
 * - userId: Filter by created user ID (optional)
 * 
 * Returns: { success: boolean, count: number, visitForms: VisitForm[], timestamp: string }
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now()

  try {
    // 1. Validate API key
    const apiKeyRaw = request.headers.get("x-api-key")
    const apiKey = apiKeyRaw?.trim() || null // Trim whitespace from header value
    const validation = await validateApiKey(apiKey)

    if (!validation.valid) {
      console.warn(`🚫 [RADIUS-API] Invalid API key attempt: ${validation.error}`)
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
          details: validation.error || "Invalid API key",
        },
        { status: 401 }
      )
    }

    console.log(
      `✅ [RADIUS-API] Authenticated request from microservice: ${validation.key?.microservice_code}`
    )

    // 2. Parse query parameters
    const { searchParams } = new URL(request.url)
    const appointmentId = searchParams.get("appointmentId")
    const status = searchParams.get("status")
    const userId = searchParams.get("userId")

    // 3. Build dynamic query
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

    const whereClause =
      whereConditions.length > 0 ? `WHERE ${whereConditions.join(" AND ")}` : ""

    // 4. Query RadiusBifrost directly
    console.log(`📋 [RADIUS-API] Fetching visit forms with filters:`, {
      appointmentId,
      status,
      userId,
    })

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
        a.title as appointment_title,
        a.location_address
      FROM visit_forms vf
      LEFT JOIN appointments a ON vf.appointment_id = a.appointment_id
      ${whereClause}
      ORDER BY vf.updated_at DESC
    `,
      params
    )

    const duration = Date.now() - startTime

    console.log(
      `✅ [RADIUS-API] Successfully retrieved ${visitForms.length} visit forms in ${duration}ms`
    )

    // 5. Process and return response
    const processedForms = visitForms.map((form: any) => ({
      ...form,
      // Parse JSON fields if they exist
      visit_info: form.visit_info ? JSON.parse(form.visit_info) : null,
      family_info: form.family_info ? JSON.parse(form.family_info) : null,
      attendees: form.attendees ? JSON.parse(form.attendees) : null,
      observations: form.observations ? JSON.parse(form.observations) : null,
      recommendations: form.recommendations
        ? JSON.parse(form.recommendations)
        : null,
      signatures: form.signatures ? JSON.parse(form.signatures) : null,
      home_environment: form.home_environment
        ? JSON.parse(form.home_environment)
        : null,
      child_interviews: form.child_interviews
        ? JSON.parse(form.child_interviews)
        : null,
      parent_interviews: form.parent_interviews
        ? JSON.parse(form.parent_interviews)
        : null,
      compliance_review: form.compliance_review
        ? JSON.parse(form.compliance_review)
        : null,
      save_history_json: form.save_history_json
        ? JSON.parse(form.save_history_json)
        : null,
    }))

    return NextResponse.json({
      success: true,
      count: processedForms.length,
      visitForms: processedForms,
      timestamp: new Date().toISOString(),
      duration_ms: duration,
    })
  } catch (error) {
    const duration = Date.now() - startTime
    console.error("❌ [RADIUS-API] Error in visit-forms endpoint:", error)

    return NextResponse.json(
      {
        success: false,
        count: 0,
        visitForms: [],
        error: error instanceof Error ? error.message : "Unknown error occurred",
        timestamp: new Date().toISOString(),
        duration_ms: duration,
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/radius/visit-forms
 * 
 * Create or update a visit form in RadiusBifrost
 * Requires API key authentication via x-api-key header
 * 
 * Body: Visit form data (see VisitForm interface)
 * Returns: { success: boolean, visitFormId: string, message: string }
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    // 1. Validate API key
    const apiKeyRaw = request.headers.get("x-api-key")
    const apiKey = apiKeyRaw?.trim() || null
    const validation = await validateApiKey(apiKey)

    if (!validation.valid) {
      console.warn(`🚫 [RADIUS-API] Invalid API key attempt: ${validation.error}`)
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
          details: validation.error || "Invalid API key",
        },
        { status: 401 }
      )
    }

    console.log(
      `✅ [RADIUS-API] Authenticated request from microservice: ${validation.key?.microservice_code}`
    )

    // 2. Parse request body
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
      currentSessionId,
      currentSessionUserId,
      currentSessionUserName,
      actorRadiusGuid,
      actorEntityGuid,
      actorUserType,
    } = body

    // 3. Validation
    if (!appointmentId || !visitDate || !visitTime || !createdByUserId || !createdByName) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: appointmentId, visitDate, visitTime, createdByUserId, createdByName",
        },
        { status: 400 }
      )
    }

    // 4. Parse visit date
    let parsedVisitDate: Date
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

    // 5. Serialize JSON fields
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

    // 6. Check if appointment exists
    const appointmentExists = await query(
      "SELECT COUNT(*) as count FROM appointments WHERE appointment_id = @param0 AND is_deleted = 0",
      [appointmentId]
    )

    if (appointmentExists[0].count === 0) {
      return NextResponse.json(
        { success: false, error: "Appointment not found" },
        { status: 404 }
      )
    }

    // 7. Check if visit form already exists
    const existingForm = await query(
      `SELECT 
        visit_form_id, 
        current_session_id, 
        current_session_last_save, 
        current_session_save_type, 
        current_session_user_id, 
        current_session_user_name, 
        save_history_json 
      FROM visit_forms 
      WHERE appointment_id = @param0 AND is_deleted = 0`,
      [appointmentId]
    )

    const saveType = isAutoSave ? "auto" : "manual"

    if (existingForm.length > 0) {
      // Update existing form
      const visitFormId = existingForm[0].visit_form_id
      const previousSessionId = existingForm[0].current_session_id
      const previousSessionLastSave = existingForm[0].current_session_last_save
      const previousSessionSaveType = existingForm[0].current_session_save_type
      const previousSessionUserId = existingForm[0].current_session_user_id
      const previousSessionUserName = existingForm[0].current_session_user_name
      const existingHistory = existingForm[0].save_history_json
        ? JSON.parse(existingForm[0].save_history_json)
        : []

      // If this is a new session, commit previous session's save to history
      let updatedHistory = existingHistory
      if (
        previousSessionId &&
        currentSessionId &&
        previousSessionId !== currentSessionId &&
        previousSessionLastSave
      ) {
        const historyEntry = {
          sessionId: previousSessionId,
          lastSave: previousSessionLastSave,
          saveType: previousSessionSaveType || "manual",
          userId: previousSessionUserId || createdByUserId,
          userName: previousSessionUserName || createdByName,
        }
        updatedHistory = [...existingHistory, historyEntry]
      }

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
          current_session_id = @param19,
          current_session_last_save = GETUTCDATE(),
          current_session_save_type = @param20,
          current_session_user_id = @param21,
          current_session_user_name = @param22,
          save_history_json = @param23,
          actor_radius_guid = @param24,
          actor_entity_guid = @param25,
          actor_user_type = @param26
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
          current_session_id,
          current_session_last_save,
          current_session_save_type,
          current_session_user_id,
          current_session_user_name,
          save_history_json,
          actor_radius_guid,
          actor_entity_guid,
          actor_user_type,
          created_at,
          updated_at
        )
        OUTPUT INSERTED.visit_form_id, INSERTED.created_at
        VALUES (
          @param0, @param1, @param2, @param3, @param4, @param5,
          @param6, @param7, @param8, @param9, @param10, @param11,
          @param12, @param13, @param14, @param15, @param16, @param17,
          @param18, @param19, @param20, @param21, @param22, @param23,
          @param24, @param25, @param26, @param27, @param28, @param29, @param30, @param31,
          GETUTCDATE(), GETUTCDATE()
        )
      `,
        [
          appointmentId,
          formType,
          formVersion,
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
          isAutoSave ? new Date() : null,
          isAutoSave ? 1 : 0,
          currentSessionId || null,
          new Date(),
          saveType,
          currentSessionUserId || createdByUserId,
          currentSessionUserName || createdByName,
          "[]",
          actorRadiusGuid || null,
          actorEntityGuid || null,
          actorUserType || null,
        ]
      )

      const visitFormId = result[0].visit_form_id
      const duration = Date.now() - startTime
      console.log(`✅ [RADIUS-API] Created visit form ${visitFormId} in ${duration}ms`)

      return NextResponse.json(
        {
          success: true,
          visitFormId,
          message: isAutoSave ? "Form auto-saved successfully" : "Visit form created successfully",
          isAutoSave,
          timestamp: new Date().toISOString(),
          duration_ms: duration,
        },
        { status: 201 }
      )
    }
  } catch (error) {
    const duration = Date.now() - startTime
    console.error("❌ [RADIUS-API] Error in visit-forms POST:", error)

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

