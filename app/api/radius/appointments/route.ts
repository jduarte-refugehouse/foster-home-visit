import { NextRequest, NextResponse } from "next/server"
import { validateApiKey } from "@/lib/api-auth"
import { query } from "@refugehouse/shared-core/db"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

/**
 * GET /api/radius/appointments
 * 
 * Proxy endpoint for accessing appointment data from RadiusBifrost
 * Requires API key authentication via x-api-key header
 * 
 * Query Parameters:
 * - startDate: Filter appointments from this date (ISO string)
 * - endDate: Filter appointments until this date (ISO string)
 * - assignedTo: Filter by assigned user ID (optional)
 * - status: Filter by status (optional)
 * - type: Filter by appointment type (optional)
 * 
 * Returns: { success: boolean, count: number, appointments: Appointment[], timestamp: string }
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now()

  try {
    // 1. Validate API key
    const apiKey = request.headers.get("x-api-key")
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
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")
    const assignedTo = searchParams.get("assignedTo")
    const status = searchParams.get("status")
    const appointmentType = searchParams.get("type")

    // 3. Build dynamic query
    const whereConditions = ["a.is_deleted = 0"]
    const params: any[] = []
    let paramIndex = 0

    if (startDate) {
      whereConditions.push(`a.start_datetime >= @param${paramIndex}`)
      params.push(new Date(startDate))
      paramIndex++
    }

    if (endDate) {
      whereConditions.push(`a.end_datetime <= @param${paramIndex}`)
      params.push(new Date(endDate))
      paramIndex++
    }

    if (assignedTo) {
      whereConditions.push(`a.assigned_to_user_id = @param${paramIndex}`)
      params.push(assignedTo)
      paramIndex++
    }

    if (status) {
      whereConditions.push(`a.status = @param${paramIndex}`)
      params.push(status)
      paramIndex++
    }

    if (appointmentType) {
      whereConditions.push(`a.appointment_type = @param${paramIndex}`)
      params.push(appointmentType)
      paramIndex++
    }

    const whereClause =
      whereConditions.length > 0 ? `WHERE ${whereConditions.join(" AND ")}` : ""

    // 4. Query RadiusBifrost directly
    console.log(`📅 [RADIUS-API] Fetching appointments with filters:`, {
      startDate,
      endDate,
      assignedTo,
      status,
      appointmentType,
    })

    const appointments = await query(
      `
      SELECT 
        a.appointment_id,
        a.title,
        a.description,
        a.appointment_type,
        a.start_datetime,
        a.end_datetime,
        a.duration_minutes,
        a.status,
        a.home_xref,
        a.location_address,
        a.location_notes,
        a.assigned_to_user_id,
        a.assigned_to_name,
        a.assigned_to_role,
        a.created_by_user_id,
        a.created_by_name,
        a.priority,
        a.is_recurring,
        a.recurring_pattern,
        a.parent_appointment_id,
        a.preparation_notes,
        a.completion_notes,
        a.outcome,
        a.created_at,
        a.updated_at,
        h.HomeName as home_name,
        h.Street,
        h.City,
        h.State,
        h.Zip,
        h.Unit,
        h.CaseManager,
        h.HomePhone
      FROM appointments a
      LEFT JOIN SyncActiveHomes h ON a.home_xref = h.Xref
      ${whereClause}
      ORDER BY a.start_datetime DESC
    `,
      params
    )

    const duration = Date.now() - startTime

    console.log(
      `✅ [RADIUS-API] Successfully retrieved ${appointments.length} appointments in ${duration}ms`
    )

    // 5. Return response
    return NextResponse.json({
      success: true,
      count: appointments.length,
      appointments,
      timestamp: new Date().toISOString(),
      duration_ms: duration,
    })
  } catch (error) {
    const duration = Date.now() - startTime
    console.error("❌ [RADIUS-API] Error in appointments endpoint:", error)

    return NextResponse.json(
      {
        success: false,
        count: 0,
        appointments: [],
        error: error instanceof Error ? error.message : "Unknown error occurred",
        timestamp: new Date().toISOString(),
        duration_ms: duration,
      },
      { status: 500 }
    )
  }
}

