import { NextRequest, NextResponse } from "next/server"
import { validateApiKey } from "@/lib/api-auth"
import { query } from "@refugehouse/shared-core/db"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"
export const maxDuration = 60

/**
 * GET /api/radius/on-call
 * 
 * Get on-call schedules with optional filtering
 * Requires API key authentication via x-api-key header
 */
export async function GET(request: NextRequest) {
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

    // 2. Parse query parameters
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")
    const userId = searchParams.get("userId")
    const onCallType = searchParams.get("type")
    const includeDeleted = searchParams.get("includeDeleted") === "true"

    // 3. Build dynamic query
    let whereConditions = ["ocs.is_active = 1"]
    const params: any[] = []

    if (!includeDeleted) {
      whereConditions.push("ocs.is_deleted = 0")
    }

    if (startDate) {
      params.push(startDate)
      whereConditions.push(`ocs.end_datetime >= @param${params.length - 1}`)
    }

    if (endDate) {
      params.push(endDate)
      whereConditions.push(`ocs.start_datetime <= @param${params.length - 1}`)
    }

    if (userId) {
      // Convert Clerk user ID to app_users.id if needed
      const isGuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)

      if (isGuid) {
        params.push(userId)
        whereConditions.push(`ocs.user_id = @param${params.length - 1}`)
      } else {
        // It's a Clerk ID, look it up
        const userLookup = await query(`SELECT id FROM app_users WHERE clerk_user_id = @param0`, [userId])

        if (userLookup.length > 0) {
          const appUserId = userLookup[0].id
          params.push(appUserId)
          whereConditions.push(`ocs.user_id = @param${params.length - 1}`)
        } else {
          // Add impossible condition so query returns empty
          whereConditions.push(`1 = 0`)
        }
      }
    }

    if (onCallType) {
      params.push(onCallType)
      whereConditions.push(`ocs.on_call_type = @param${params.length - 1}`)
    }

    const whereClause = whereConditions.join(" AND ")

    // 4. Query on-call schedules
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
        -- Calculate if currently on call
        CASE 
          WHEN GETDATE() BETWEEN ocs.start_datetime AND ocs.end_datetime 
          THEN 1 
          ELSE 0 
        END as is_currently_active,
        -- User details from app_users if linked
        u.first_name,
        u.last_name,
        u.email as user_app_email
      FROM on_call_schedule ocs
      LEFT JOIN app_users u ON ocs.user_id = u.id
      WHERE ${whereClause}
      ORDER BY ocs.start_datetime ASC
    `,
      params
    )

    const duration = Date.now() - startTime
    console.log(`✅ [RADIUS-API] Retrieved ${schedules.length} on-call schedules in ${duration}ms`)

    return NextResponse.json({
      success: true,
      count: schedules.length,
      schedules,
      timestamp: new Date().toISOString(),
      duration_ms: duration,
    })
  } catch (error) {
    const duration = Date.now() - startTime
    console.error("❌ [RADIUS-API] Error in on-call GET:", error)

    return NextResponse.json(
      {
        success: false,
        count: 0,
        schedules: [],
        error: error instanceof Error ? error.message : "Unknown error occurred",
        timestamp: new Date().toISOString(),
        duration_ms: duration,
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/radius/on-call
 * 
 * Create a new on-call schedule assignment
 * Requires API key authentication via x-api-key header
 */
export async function POST(request: NextRequest) {
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

    // 2. Parse request body
    const body = await request.json()
    const {
      userId,
      appUserId: providedAppUserId,
      userName,
      userEmail,
      userPhone,
      phoneFromDatabase,
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
      createdByUserId,
      createdByName,
    } = body

    // 3. Validation
    if (!userName || !startDatetime || !endDatetime) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: userName, startDatetime, endDatetime",
        },
        { status: 400 }
      )
    }

    // Validate date range
    const start = new Date(startDatetime)
    const end = new Date(endDatetime)
    if (end <= start) {
      return NextResponse.json(
        {
          success: false,
          error: "End datetime must be after start datetime",
        },
        { status: 400 }
      )
    }

    // 4. Use provided appUserId if available, otherwise convert from userId
    let appUserId: string | null = providedAppUserId || null

    // If not provided, try to convert from userId
    if (!appUserId && userId) {
      // Check if userId is already a GUID or if it's a Clerk ID
      const isGuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)

      if (isGuid) {
        appUserId = userId
      } else {
        // It's a Clerk ID, look up the app_users.id
        const userLookup = await query(`SELECT id FROM app_users WHERE clerk_user_id = @param0`, [userId])

        if (userLookup.length > 0) {
          appUserId = userLookup[0].id
        }
      }
    }

    // 5. Check for overlapping assignments
    if (appUserId) {
      const overlaps = await query(
        `
        SELECT COUNT(*) as overlap_count
        FROM on_call_schedule
        WHERE user_id = @param0
          AND is_active = 1
          AND is_deleted = 0
          AND (
            (start_datetime < @param2 AND end_datetime > @param1)
          )
      `,
        [appUserId, startDatetime, endDatetime]
      )

      if (overlaps[0].overlap_count > 0) {
        return NextResponse.json(
          {
            success: false,
            error: "This user already has an overlapping on-call assignment",
            code: "OVERLAP_CONFLICT",
          },
          { status: 409 }
        )
      }
    }

    // 6. Update app_users with phone number if provided
    if (appUserId && userPhone && !phoneFromDatabase) {
      try {
        await query(`UPDATE app_users SET phone = @param0, updated_at = GETDATE() WHERE id = @param1`, [
          userPhone,
          appUserId,
        ])
      } catch (error) {
        console.error(`⚠️ [RADIUS-API] Failed to update app_users with phone:`, error)
        // Don't fail the entire request if phone update fails
      }
    }

    // 7. Calculate duration
    const durationHours = Math.round(((end.getTime() - start.getTime()) / (1000 * 60 * 60)) * 100) / 100

    // 8. Create the on-call schedule
    const scheduleId = crypto.randomUUID()
    const result = await query(
      `
      INSERT INTO on_call_schedule (
        id,
        user_id,
        user_name,
        user_email,
        user_phone,
        start_datetime,
        end_datetime,
        notes,
        priority_level,
        on_call_type,
        on_call_category,
        role_required,
        department,
        region,
        escalation_level,
        is_active,
        created_by_user_id,
        created_by_name,
        created_at,
        updated_at
      )
      OUTPUT INSERTED.id, INSERTED.created_at
      VALUES (
        @param0, @param1, @param2, @param3, @param4, @param5, @param6,
        @param7, @param8, @param9, @param10, @param11, @param12, @param13,
        @param14, 1, @param15, @param16, GETUTCDATE(), GETUTCDATE()
      )
    `,
      [
        scheduleId,
        appUserId,
        userName,
        userEmail || null,
        userPhone || null,
        startDatetime,
        endDatetime,
        notes || null,
        priorityLevel || "normal",
        onCallType || "general",
        onCallCategory || null,
        roleRequired || null,
        department || null,
        region || null,
        escalationLevel || 1,
        createdByUserId || null,
        createdByName || null,
      ]
    )

    const duration = Date.now() - startTime
    console.log(`✅ [RADIUS-API] Created on-call schedule ${scheduleId} in ${duration}ms`)

    return NextResponse.json(
      {
        success: true,
        id: scheduleId,
        created_at: result[0].created_at,
        timestamp: new Date().toISOString(),
        duration_ms: duration,
      },
      { status: 201 }
    )
  } catch (error) {
    const duration = Date.now() - startTime
    console.error("❌ [RADIUS-API] Error in on-call POST:", error)

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

