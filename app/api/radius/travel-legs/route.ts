import { NextRequest, NextResponse } from "next/server"
import { validateApiKey } from "@/lib/api-auth"
import { query } from "@refugehouse/shared-core/db"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"
export const maxDuration = 60

/**
 * GET /api/radius/travel-legs
 * 
 * Get travel legs with optional filtering
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
    const staffUserId = searchParams.get("staffUserId")
    const date = searchParams.get("date")
    const journeyId = searchParams.get("journeyId")
    const status = searchParams.get("status")
    const appointmentId = searchParams.get("appointmentId")
    const includeDeleted = searchParams.get("includeDeleted") === "true"

    // 3. Build dynamic query
    const conditions: string[] = []
    const params: any[] = []
    let paramIndex = 0

    if (!includeDeleted) {
      conditions.push("is_deleted = 0")
    }

    if (staffUserId) {
      conditions.push(`staff_user_id = @param${paramIndex}`)
      params.push(staffUserId)
      paramIndex++
    }

    if (date) {
      const dateStart = new Date(date)
      dateStart.setHours(0, 0, 0, 0)
      const dateEnd = new Date(date)
      dateEnd.setHours(23, 59, 59, 999)

      conditions.push(`start_timestamp >= @param${paramIndex}`)
      params.push(dateStart.toISOString())
      paramIndex++

      conditions.push(`start_timestamp <= @param${paramIndex}`)
      params.push(dateEnd.toISOString())
      paramIndex++
    }

    if (journeyId) {
      conditions.push(`journey_id = @param${paramIndex}`)
      params.push(journeyId)
      paramIndex++
    }

    if (status) {
      conditions.push(`leg_status = @param${paramIndex}`)
      params.push(status)
      paramIndex++
    }

    if (appointmentId) {
      conditions.push(`(appointment_id_from = @param${paramIndex} OR appointment_id_to = @param${paramIndex})`)
      params.push(appointmentId)
      paramIndex++
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : ""

    // 4. Query travel legs
    const legs = await query(
      `
      SELECT 
        leg_id,
        staff_user_id,
        staff_name,
        journey_id,
        leg_sequence,
        start_latitude,
        start_longitude,
        start_timestamp,
        start_location_name,
        start_location_address,
        start_location_type,
        end_latitude,
        end_longitude,
        end_timestamp,
        end_location_name,
        end_location_address,
        end_location_type,
        appointment_id_from,
        appointment_id_to,
        calculated_mileage,
        estimated_toll_cost,
        duration_minutes,
        travel_purpose,
        vehicle_type,
        is_final_leg,
        leg_status,
        created_at,
        updated_at,
        created_by_user_id,
        updated_by_user_id
      FROM travel_legs
      ${whereClause}
      ORDER BY start_timestamp DESC
    `,
      params
    )

    const duration = Date.now() - startTime
    console.log(`✅ [RADIUS-API] Retrieved ${legs.length} travel legs in ${duration}ms`)

    return NextResponse.json({
      success: true,
      count: legs.length,
      legs,
      timestamp: new Date().toISOString(),
      duration_ms: duration,
    })
  } catch (error) {
    const duration = Date.now() - startTime
    console.error("❌ [RADIUS-API] Error in travel-legs GET:", error)

    return NextResponse.json(
      {
        success: false,
        count: 0,
        legs: [],
        error: error instanceof Error ? error.message : "Unknown error occurred",
        timestamp: new Date().toISOString(),
        duration_ms: duration,
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/radius/travel-legs
 * 
 * Create a new travel leg
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
      staff_user_id,
      start_latitude,
      start_longitude,
      start_timestamp,
      start_location_name,
      start_location_address,
      start_location_type,
      appointment_id_from,
      appointment_id_to,
      journey_id,
      travel_purpose,
      vehicle_type,
      is_final_leg,
    } = body

    // 3. Validation
    if (!staff_user_id || start_latitude === undefined || start_longitude === undefined || !start_timestamp) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: staff_user_id, start_latitude, start_longitude, start_timestamp",
        },
        { status: 400 }
      )
    }

    // 4. Generate journey_id if not provided (new trip)
    const finalJourneyId = journey_id || crypto.randomUUID()
    const isNewTrip = !journey_id

    // 5. If this is a new trip, create the trip record first
    if (isNewTrip) {
      // Get staff_name if not provided (try to get from app_users)
      let staffName = body.staff_name || null
      if (!staffName && staff_user_id) {
        try {
          const userResult = await query(
            `SELECT first_name, last_name 
             FROM app_users 
             WHERE clerk_user_id = @param0 AND is_active = 1`,
            [staff_user_id]
          )
          if (userResult.length > 0) {
            const user = userResult[0]
            staffName = `${user.first_name || ''} ${user.last_name || ''}`.trim() || null
          }
        } catch (userError) {
          console.warn("⚠️ [RADIUS-API] Could not fetch staff name (non-fatal):", userError)
        }
      }

      // Create journey record
      try {
        await query(
          `INSERT INTO travel_journeys (
            journey_id, staff_user_id, staff_name, travel_purpose,
            start_timestamp, trip_status, created_by_user_id
          )
          VALUES (
            @param0, @param1, @param2, @param3,
            @param4, 'in_progress', @param5
          )`,
          [
            finalJourneyId,
            staff_user_id,
            staffName,
            travel_purpose || null,
            start_timestamp,
            staff_user_id, // created_by_user_id
          ]
        )
        console.log(`✅ [RADIUS-API] Created journey record ${finalJourneyId}`)
      } catch (tripError: any) {
        // If travel_journeys table doesn't exist yet, log warning but continue
        if (tripError.message?.includes("Invalid object name") || tripError.message?.includes("travel_journeys")) {
          console.warn("⚠️ [RADIUS-API] travel_journeys table not found - please run create-trips-table.sql migration")
        } else {
          console.error("❌ [RADIUS-API] Error creating trip record (non-fatal):", tripError)
        }
        // Continue with leg creation even if trip creation fails
      }
    }

    // 6. Get leg sequence for this journey
    let legSequence = 1
    if (journey_id) {
      const existingLegs = await query(
        `SELECT MAX(leg_sequence) as max_sequence 
         FROM travel_legs 
         WHERE journey_id = @param0 AND is_deleted = 0`,
        [journey_id]
      )
      legSequence = (existingLegs[0]?.max_sequence || 0) + 1
    }

    // 7. Insert new leg
    const result = await query(
      `INSERT INTO travel_legs (
        staff_user_id, journey_id, leg_sequence,
        start_latitude, start_longitude, start_timestamp,
        start_location_name, start_location_address, start_location_type,
        appointment_id_from, appointment_id_to, travel_purpose, vehicle_type,
        is_final_leg, leg_status, created_by_user_id
      )
      OUTPUT INSERTED.leg_id, INSERTED.created_at
      VALUES (
        @param0, @param1, @param2,
        @param3, @param4, @param5,
        @param6, @param7, @param8,
        @param9, @param10, @param11, @param12,
        @param13, 'in_progress', @param14
      )`,
      [
        staff_user_id,
        finalJourneyId,
        legSequence,
        start_latitude,
        start_longitude,
        start_timestamp,
        start_location_name || null,
        start_location_address || null,
        start_location_type || null,
        appointment_id_from || null,
        appointment_id_to || null,
        travel_purpose || null,
        vehicle_type || null,
        is_final_leg || false,
        staff_user_id, // created_by_user_id
      ]
    )

    const legId = result[0].leg_id
    const duration = Date.now() - startTime
    console.log(`✅ [RADIUS-API] Created travel leg ${legId} in ${duration}ms`)

    return NextResponse.json(
      {
        success: true,
        leg_id: legId,
        journey_id: finalJourneyId,
        leg_sequence: legSequence,
        created_at: result[0].created_at,
        timestamp: new Date().toISOString(),
        duration_ms: duration,
      },
      { status: 201 }
    )
  } catch (error) {
    const duration = Date.now() - startTime
    console.error("❌ [RADIUS-API] Error in travel-legs POST:", error)

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

