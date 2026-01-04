import { NextRequest, NextResponse } from "next/server"
import { validateApiKey } from "@/lib/api-auth"
import { query } from "@refugehouse/shared-core/db"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"
export const maxDuration = 60

/**
 * GET /api/radius/on-call/[id]
 * 
 * Get a specific on-call schedule by ID
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

    const scheduleId = params.id

    // 2. Query on-call schedule
    const schedules = await query(
      `
      SELECT 
        ocs.id,
        ocs.user_id,
        ocs.user_name,
        ocs.user_email,
        ocs.user_phone,
        ocs.start_datetime,
        ocs.end_datetime,
        ocs.duration_hours,
        ocs.on_call_type,
        ocs.on_call_category,
        ocs.role_required,
        ocs.department,
        ocs.region,
        ocs.escalation_level,
        ocs.is_active,
        ocs.notes,
        ocs.priority_level,
        ocs.created_by_name,
        ocs.created_at,
        ocs.updated_at,
        ocs.updated_by_name,
        CASE 
          WHEN GETDATE() BETWEEN ocs.start_datetime AND ocs.end_datetime 
          THEN 1 
          ELSE 0 
        END as is_currently_active,
        u.first_name,
        u.last_name,
        u.email as user_app_email
      FROM on_call_schedule ocs
      LEFT JOIN app_users u ON ocs.user_id = u.id
      WHERE ocs.id = @param0 AND ocs.is_deleted = 0
    `,
      [scheduleId]
    )

    if (schedules.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "On-call schedule not found",
        },
        { status: 404 }
      )
    }

    const duration = Date.now() - startTime

    return NextResponse.json({
      success: true,
      schedule: schedules[0],
      timestamp: new Date().toISOString(),
      duration_ms: duration,
    })
  } catch (error) {
    const duration = Date.now() - startTime
    console.error("❌ [RADIUS-API] Error in on-call GET [id]:", error)

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
 * PUT /api/radius/on-call/[id]
 * 
 * Update an existing on-call schedule
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

    const scheduleId = params.id
    const body = await request.json()
    const {
      userName,
      userEmail,
      userPhone,
      startDatetime,
      endDatetime,
      notes,
      priorityLevel,
      onCallType,
      onCallCategory,
      roleRequired,
      department,
      region,
      escalationLevel,
      isActive,
      updatedByUserId,
      updatedByName,
    } = body

    // 2. Check if schedule exists
    const existingSchedule = await query(
      "SELECT id, user_id FROM on_call_schedule WHERE id = @param0 AND is_deleted = 0",
      [scheduleId]
    )

    if (existingSchedule.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "On-call schedule not found",
        },
        { status: 404 }
      )
    }

    // 3. Build dynamic update query
    const updateFields: string[] = []
    const queryParams: any[] = []
    let paramIndex = 0

    if (userName !== undefined) {
      updateFields.push(`user_name = @param${paramIndex}`)
      queryParams.push(userName)
      paramIndex++
    }

    if (userEmail !== undefined) {
      updateFields.push(`user_email = @param${paramIndex}`)
      queryParams.push(userEmail)
      paramIndex++
    }

    if (userPhone !== undefined) {
      updateFields.push(`user_phone = @param${paramIndex}`)
      queryParams.push(userPhone)
      paramIndex++
    }

    if (startDatetime !== undefined) {
      updateFields.push(`start_datetime = @param${paramIndex}`)
      queryParams.push(startDatetime)
      paramIndex++
    }

    if (endDatetime !== undefined) {
      updateFields.push(`end_datetime = @param${paramIndex}`)
      queryParams.push(endDatetime)
      paramIndex++

      // Recalculate duration if end_datetime changed
      if (startDatetime !== undefined || existingSchedule[0]) {
        const start = startDatetime ? new Date(startDatetime) : new Date(existingSchedule[0].start_datetime)
        const end = new Date(endDatetime)
        const durationHours = Math.round(((end.getTime() - start.getTime()) / (1000 * 60 * 60)) * 100) / 100
        updateFields.push(`duration_hours = @param${paramIndex}`)
        queryParams.push(durationHours)
        paramIndex++
      }
    }

    if (notes !== undefined) {
      updateFields.push(`notes = @param${paramIndex}`)
      queryParams.push(notes)
      paramIndex++
    }

    if (priorityLevel !== undefined) {
      updateFields.push(`priority_level = @param${paramIndex}`)
      queryParams.push(priorityLevel)
      paramIndex++
    }

    if (onCallType !== undefined) {
      updateFields.push(`on_call_type = @param${paramIndex}`)
      queryParams.push(onCallType)
      paramIndex++
    }

    if (onCallCategory !== undefined) {
      updateFields.push(`on_call_category = @param${paramIndex}`)
      queryParams.push(onCallCategory)
      paramIndex++
    }

    if (roleRequired !== undefined) {
      updateFields.push(`role_required = @param${paramIndex}`)
      queryParams.push(roleRequired)
      paramIndex++
    }

    if (department !== undefined) {
      updateFields.push(`department = @param${paramIndex}`)
      queryParams.push(department)
      paramIndex++
    }

    if (region !== undefined) {
      updateFields.push(`region = @param${paramIndex}`)
      queryParams.push(region)
      paramIndex++
    }

    if (escalationLevel !== undefined) {
      updateFields.push(`escalation_level = @param${paramIndex}`)
      queryParams.push(escalationLevel)
      paramIndex++
    }

    if (isActive !== undefined) {
      updateFields.push(`is_active = @param${paramIndex}`)
      queryParams.push(isActive ? 1 : 0)
      paramIndex++
    }

    // Always update updated_at
    updateFields.push(`updated_at = GETUTCDATE()`)

    if (updatedByUserId !== undefined) {
      updateFields.push(`updated_by_user_id = @param${paramIndex}`)
      queryParams.push(updatedByUserId)
      paramIndex++
    }

    if (updatedByName !== undefined) {
      updateFields.push(`updated_by_name = @param${paramIndex}`)
      queryParams.push(updatedByName)
      paramIndex++
    }

    if (updateFields.length === 1) {
      // Only updated_at
      return NextResponse.json(
        { success: false, error: "No fields to update" },
        { status: 400 }
      )
    }

    // Add schedule ID as the last parameter
    queryParams.push(scheduleId)

    // 4. Update schedule
    await query(
      `
      UPDATE on_call_schedule 
      SET ${updateFields.join(", ")}
      WHERE id = @param${paramIndex} AND is_deleted = 0
    `,
      queryParams
    )

    const duration = Date.now() - startTime
    console.log(`✅ [RADIUS-API] Updated on-call schedule ${scheduleId} in ${duration}ms`)

    return NextResponse.json({
      success: true,
      id: scheduleId,
      message: "On-call schedule updated successfully",
      timestamp: new Date().toISOString(),
      duration_ms: duration,
    })
  } catch (error) {
    const duration = Date.now() - startTime
    console.error("❌ [RADIUS-API] Error in on-call PUT [id]:", error)

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
 * DELETE /api/radius/on-call/[id]
 * 
 * Soft delete an on-call schedule
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

    const scheduleId = params.id
    const body = await request.json().catch(() => ({}))
    const { deletedByUserId, deletedByName } = body

    // 2. Check if schedule exists
    const existingSchedule = await query(
      "SELECT id FROM on_call_schedule WHERE id = @param0 AND is_deleted = 0",
      [scheduleId]
    )

    if (existingSchedule.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "On-call schedule not found",
        },
        { status: 404 }
      )
    }

    // 3. Soft delete
    await query(
      `
      UPDATE on_call_schedule 
      SET 
        is_deleted = 1,
        deleted_at = GETUTCDATE(),
        deleted_by_user_id = @param1,
        deleted_by_name = @param2,
        updated_at = GETUTCDATE()
      WHERE id = @param0
    `,
      [scheduleId, deletedByUserId || null, deletedByName || null]
    )

    const duration = Date.now() - startTime
    console.log(`✅ [RADIUS-API] Soft deleted on-call schedule ${scheduleId} in ${duration}ms`)

    return NextResponse.json({
      success: true,
      id: scheduleId,
      message: "On-call schedule deleted successfully",
      timestamp: new Date().toISOString(),
      duration_ms: duration,
    })
  } catch (error) {
    const duration = Date.now() - startTime
    console.error("❌ [RADIUS-API] Error in on-call DELETE [id]:", error)

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

