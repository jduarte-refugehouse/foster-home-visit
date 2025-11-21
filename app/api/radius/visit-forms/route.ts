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

