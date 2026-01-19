import { NextResponse, type NextRequest } from "next/server"
import { query } from "@refugehouse/shared-core/db"
import { shouldUseRadiusApiClient, throwIfDirectDbNotAllowed } from "@/lib/microservice-config"

export const dynamic = "force-dynamic"

/**
 * POST - Log a continuum entry (activity)
 * Supports multi-dimensional tracking per continuum concept
 * 
 * NOTE: This endpoint uses the legacy continuum_entries table.
 * New code should use ContinuumMark via the API Hub instead.
 */
export async function POST(request: NextRequest) {
  try {
    // CRITICAL: Pass request parameter for hostname detection
    const useApiClient = shouldUseRadiusApiClient(request)
    
    if (useApiClient) {
      // For visit service: Continuum entries endpoint not yet migrated to API Hub
      // Return success but skip logging (non-blocking) until API Hub endpoint is available
      console.warn("⚠️ [CONTINUUM] Continuum entries logging not available via API Hub. Skipping log (non-blocking).")
      return NextResponse.json(
        {
          success: true, // Return success to not block the operation
          entryId: null,
          warning: "Continuum entries endpoint not yet migrated to API Hub. Entry not logged.",
          details: "This endpoint uses the legacy continuum_entries table. Please use ContinuumMark via the API Hub instead.",
        },
        { status: 200 }, // Return 200 OK (non-blocking) instead of 501
      )
    }
    const body = await request.json()
    const {
      appointmentId,
      activityType,
      activityStatus = 'active',
      timestamp,
      durationMinutes,
      staffUserId,
      staffName,
      homeGuid,
      homeXref,
      homeName,
      entityGuids, // Array of GUIDs
      activityDescription,
      metadata, // JSON object
      locationLatitude,
      locationLongitude,
      locationAddress,
      contextNotes,
      outcome,
      triggeredByEntryId,
      createdByUserId,
    } = body

    // Validate required fields
    if (!activityType) {
      return NextResponse.json(
        { success: false, error: "activityType is required" },
        { status: 400 }
      )
    }

    if (!timestamp) {
      return NextResponse.json(
        { success: false, error: "timestamp is required" },
        { status: 400 }
      )
    }

    // Convert entityGuids array to JSON string if provided
    const entityGuidsJson = entityGuids && Array.isArray(entityGuids) 
      ? JSON.stringify(entityGuids) 
      : null

    // Convert metadata object to JSON string if provided
    const metadataJson = metadata && typeof metadata === 'object'
      ? JSON.stringify(metadata)
      : null

    console.log(`📝 [CONTINUUM] Logging activity: ${activityType} for appointment: ${appointmentId || 'none'}`)

    const result = await query(
      `
      INSERT INTO continuum_entries (
        appointment_id,
        activity_type,
        activity_status,
        timestamp,
        duration_minutes,
        staff_user_id,
        staff_name,
        home_guid,
        home_xref,
        home_name,
        entity_guids,
        activity_description,
        metadata,
        location_latitude,
        location_longitude,
        location_address,
        context_notes,
        outcome,
        triggered_by_entry_id,
        created_by_user_id
      )
      OUTPUT INSERTED.entry_id, INSERTED.created_at
      VALUES (
        @param0, @param1, @param2, @param3, @param4, @param5, @param6,
        @param7, @param8, @param9, @param10, @param11, @param12,
        @param13, @param14, @param15, @param16, @param17, @param18, @param19
      )
      `,
      [
        appointmentId || null,
        activityType,
        activityStatus,
        timestamp,
        durationMinutes || null,
        staffUserId || null,
        staffName || null,
        homeGuid || null,
        homeXref || null,
        homeName || null,
        entityGuidsJson,
        activityDescription || null,
        metadataJson,
        locationLatitude || null,
        locationLongitude || null,
        locationAddress || null,
        contextNotes || null,
        outcome || null,
        triggeredByEntryId || null,
        createdByUserId || null,
      ]
    )

    const entryId = result[0].entry_id
    console.log(`✅ [CONTINUUM] Logged entry: ${entryId}`)

    return NextResponse.json({
      success: true,
      entryId,
      createdAt: result[0].created_at,
    })

  } catch (error: any) {
    console.error("❌ [CONTINUUM] Error logging entry:", error)
    console.error("❌ [CONTINUUM] Error details:", {
      message: error.message,
      code: error.code,
      number: error.number,
      originalError: error.originalError?.message,
    })
    
    // Check if table doesn't exist
    if (error.message?.includes("Invalid object name") || 
        error.message?.includes("continuum_entries") ||
        error.number === 208) {
      return NextResponse.json(
        {
          success: false,
          error: "Continuum entries table not found",
          details: "Please run the create-continuum-entries-table.sql script first",
          errorCode: "TABLE_NOT_FOUND",
        },
        { status: 500 }
      )
    }
    
    return NextResponse.json(
      {
        success: false,
        error: "Failed to log continuum entry",
        details: error.message || "Unknown error",
      },
      { status: 500 }
    )
  }
}

/**
 * GET - Fetch continuum entries with optional filtering
 * 
 * NOTE: This endpoint uses the legacy continuum_entries table.
 * New code should use ContinuumMark via the API Hub instead.
 */
export async function GET(request: NextRequest) {
  try {
    // CRITICAL: Pass request parameter for hostname detection
    const useApiClient = shouldUseRadiusApiClient(request)
    
    if (useApiClient) {
      // For visit service: Continuum entries endpoint not yet migrated to API Hub
      // Return empty results (non-blocking) until API Hub endpoint is available
      console.warn("⚠️ [CONTINUUM] Continuum entries fetching not available via API Hub. Returning empty results (non-blocking).")
      return NextResponse.json(
        {
          success: true,
          count: 0,
          entries: [],
          warning: "Continuum entries endpoint not yet migrated to API Hub. Please use ContinuumMark via the API Hub instead.",
        },
        { status: 200 }, // Return 200 OK (non-blocking) instead of 501
      )
    }
    const { searchParams } = new URL(request.url)
    const appointmentId = searchParams.get("appointmentId")
    const homeGuid = searchParams.get("homeGuid")
    const staffUserId = searchParams.get("staffUserId")
    const activityType = searchParams.get("activityType")
    const limit = parseInt(searchParams.get("limit") || "100")

    const conditions: string[] = ["is_deleted = 0"]
    const params: any[] = []
    let paramIndex = 0

    if (appointmentId) {
      conditions.push(`appointment_id = @param${paramIndex}`)
      params.push(appointmentId)
      paramIndex++
    }

    if (homeGuid) {
      conditions.push(`home_guid = @param${paramIndex}`)
      params.push(homeGuid)
      paramIndex++
    }

    if (staffUserId) {
      conditions.push(`staff_user_id = @param${paramIndex}`)
      params.push(staffUserId)
      paramIndex++
    }

    if (activityType) {
      conditions.push(`activity_type = @param${paramIndex}`)
      params.push(activityType)
      paramIndex++
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : ""

    const entries = await query(
      `
      SELECT TOP (@param${paramIndex})
        entry_id,
        appointment_id,
        activity_type,
        activity_status,
        timestamp,
        duration_minutes,
        staff_user_id,
        staff_name,
        home_guid,
        home_xref,
        home_name,
        entity_guids,
        activity_description,
        metadata,
        location_latitude,
        location_longitude,
        location_address,
        context_notes,
        outcome,
        triggered_by_entry_id,
        created_at,
        created_by_user_id
      FROM continuum_entries
      ${whereClause}
      ORDER BY timestamp DESC
      `,
      [...params, limit]
    )

    // Parse JSON fields
    const parsedEntries = entries.map((entry: any) => ({
      ...entry,
      entityGuids: entry.entity_guids ? JSON.parse(entry.entity_guids) : null,
      metadata: entry.metadata ? JSON.parse(entry.metadata) : null,
    }))

    return NextResponse.json({
      success: true,
      count: parsedEntries.length,
      entries: parsedEntries,
    })

  } catch (error: any) {
    console.error("❌ [CONTINUUM] Error fetching entries:", error)
    
    // Check if table doesn't exist
    if (error.message?.includes("Invalid object name") || 
        error.message?.includes("continuum_entries") ||
        error.number === 208) {
      // Return empty array if table doesn't exist yet
      return NextResponse.json({
        success: true,
        count: 0,
        entries: [],
        warning: "Continuum entries table not found. Please run the create-continuum-entries-table.sql script.",
      })
    }
    
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch continuum entries",
        details: error.message || "Unknown error",
      },
      { status: 500 }
    )
  }
}

