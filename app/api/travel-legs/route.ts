import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { getClerkUserIdFromRequest } from "@/lib/clerk-auth-helper"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * POST - Create a new travel leg (start travel)
 * 
 * Body: {
 *   staff_user_id: string (required)
 *   start_latitude: number (required)
 *   start_longitude: number (required)
 *   start_timestamp: string (ISO datetime, required)
 *   start_location_name?: string
 *   start_location_address?: string
 *   start_location_type?: 'office' | 'appointment' | 'home' | 'other'
 *   appointment_id_from?: string (UUID)
 *   journey_id?: string (UUID, optional - creates new journey if not provided)
 *   travel_purpose?: string
 *   vehicle_type?: string
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Debug: Log incoming headers
    const receivedHeaders = {
      "x-user-clerk-id": request.headers.get("x-user-clerk-id"),
      "x-user-email": request.headers.get("x-user-email"),
      "x-user-name": request.headers.get("x-user-name"),
    }
    console.log("🚗 [Travel Legs POST] Received headers:", receivedHeaders)

    // Try to get auth from headers first (desktop/tablet)
    let authInfo = getClerkUserIdFromRequest(request)
    let authMethod = "headers"
    console.log("🚗 [Travel Legs POST] Auth from headers:", { clerkUserId: authInfo.clerkUserId, email: authInfo.email })
    
    // ROBUST AUTHENTICATION: Since this is called from a protected route,
    // the user IS authenticated. We need to be flexible about how we get their ID.
    // This route will be used extensively, so it must be super robust.
    // NO MIDDLEWARE - we can't use clerkMiddleware() as it breaks everything.
    
    // Read body first (we'll need it for appointment context fallback)
    let body: any = {}
    try {
      body = await request.json()
    } catch (e) {
      console.error("🚗 [Travel Legs POST] Error reading request body:", e)
      return NextResponse.json({ 
        error: "Invalid request body" 
      }, { status: 400 })
    }
    
    // Check for token-based authentication (for tokenized requests)
    const authToken = body.auth_token || request.headers.get("x-auth-token")
    
    if (!authInfo.clerkUserId && !authInfo.email) {
      if (authToken) {
        // Token-based authentication - look up user from token
        try {
          // TODO: Implement token lookup to get user ID
          // For now, this is a placeholder
          console.log("🔍 [Travel Legs POST] Token-based auth detected, but token lookup not yet implemented")
          return NextResponse.json({ 
            error: "Token authentication not yet implemented",
            details: "Token-based authentication is planned but not yet available"
          }, { status: 501 })
        } catch (tokenError) {
          console.error("🚗 [Travel Legs POST] Error with token auth:", tokenError)
          return NextResponse.json({ 
            error: "Invalid authentication token"
          }, { status: 401 })
        }
      } else {
        // No headers and no token - require authentication
        console.error("🚗 [Travel Legs POST] No authentication found - missing headers and token")
        return NextResponse.json({ 
          error: "Authentication required",
          details: "Missing authentication headers (x-user-clerk-id or x-user-email). Please ensure you are signed in and try again.",
          mobileAuthIssue: true,
          suggestion: "If this persists, try refreshing the page"
        }, { status: 401 })
      }
    }
    
    const {
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

    // Use authenticated user ID from originally authenticated Clerk session
    // This comes from headers (x-user-clerk-id or x-user-email) set by client-side after Clerk authentication
    // Prefer clerkUserId (Clerk user ID), fallback to email
    const staff_user_id = authInfo.clerkUserId || authInfo.email
    
    // Note: appointment_id_from and appointment_id_to are used to LINK the leg to appointments
    // They are NOT used to determine the user - user comes from authenticated session (headers) or token

    // Validate required fields
    if (!staff_user_id || start_latitude === undefined || start_longitude === undefined || !start_timestamp) {
      return NextResponse.json(
        { error: "Missing required fields: start_latitude, start_longitude, start_timestamp" },
        { status: 400 }
      )
    }

    // Generate journey_id if not provided (new journey)
    const finalJourneyId = journey_id || crypto.randomUUID()

    // Get leg sequence for this journey (if adding to existing journey)
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

    // Insert new leg
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
        authInfo.clerkUserId || authInfo.email,
      ]
    )

    // Log continuum entry for drive_start if this leg is tied to an appointment
    if (appointment_id_to) {
      try {
        // Fetch appointment details for continuum entry
        const appointmentData = await query(
          `SELECT home_name, home_xref, home_guid, assigned_to_name
           FROM appointments
           WHERE appointment_id = @param0 AND is_deleted = 0`,
          [appointment_id_to]
        )

        if (appointmentData.length > 0) {
          const apt = appointmentData[0]
          // Log drive_start continuum entry
          await query(
            `INSERT INTO continuum_entries (
              appointment_id, activity_type, activity_status, timestamp,
              staff_user_id, staff_name, home_guid, home_xref, home_name,
              location_latitude, location_longitude, location_address,
              activity_description, created_by_user_id, metadata
            )
            VALUES (
              @param0, 'drive_start', 'active', @param1,
              @param2, @param3, @param4, @param5, @param6,
              @param7, @param8, @param9,
              @param10, @param11, @param12
            )`,
            [
              appointment_id_to,
              start_timestamp,
              staff_user_id,
              authInfo.name || null,
              apt.home_guid || null,
              apt.home_xref || null,
              apt.home_name || null,
              start_latitude,
              start_longitude,
              start_location_address || start_location_name || null,
              travel_purpose || `Travel to ${apt.home_name || 'appointment'}`,
              authInfo.clerkUserId || authInfo.email,
              JSON.stringify({ leg_id: result[0].leg_id, journey_id: finalJourneyId }),
            ]
          )
          console.log(`✅ [TRAVEL] Logged drive_start continuum entry for appointment ${appointment_id_to}`)
        }
      } catch (continuumError) {
        // Don't fail the leg creation if continuum logging fails
        console.error("⚠️ [TRAVEL] Failed to log continuum entry (non-fatal):", continuumError)
      }
    }

    return NextResponse.json({
      success: true,
      leg_id: result[0].leg_id,
      journey_id: finalJourneyId,
      leg_sequence: legSequence,
      created_at: result[0].created_at,
    })
  } catch (error: any) {
    console.error("❌ [TRAVEL] Error creating travel leg:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create travel leg",
        details: error.message || "Unknown error",
      },
      { status: 500 }
    )
  }
}

/**
 * GET - Fetch travel legs with optional filtering
 * 
 * Query params:
 * - staffUserId: Filter by staff member
 * - date: Filter by date (YYYY-MM-DD)
 * - journeyId: Filter by journey
 * - status: Filter by leg_status
 * - includeDeleted: Include deleted legs (default: false)
 */
export async function GET(request: NextRequest) {
  try {
    // Try to get auth from headers first (desktop/tablet)
    let authInfo = getClerkUserIdFromRequest(request)
    
    // NO CLERK USAGE AFTER AUTHENTICATION
    // User must be identified from originally authenticated session (headers) or token
    
    const { searchParams } = new URL(request.url)
    const date = searchParams.get("date")
    const journeyId = searchParams.get("journeyId")
    const status = searchParams.get("status")
    const includeDeleted = searchParams.get("includeDeleted") === "true"
    const appointmentId = searchParams.get("appointmentId") // Allow querying by appointment (for filtering, not auth)
    const authToken = searchParams.get("auth_token") || request.headers.get("x-auth-token")
    
    // Get user ID from authenticated session (headers) or token
    let staffUserId: string | null = null
    
    if (authToken) {
      // Token-based authentication
      // TODO: Implement token lookup to get user ID
      console.log("🔍 [Travel Legs GET] Token-based auth detected, but token lookup not yet implemented")
      return NextResponse.json({ 
        error: "Token authentication not yet implemented"
      }, { status: 501 })
    } else {
      // Use authenticated session (headers)
      staffUserId = searchParams.get("staffUserId") || authInfo.clerkUserId || authInfo.email
    }
    
    // Require user ID from authenticated session or token
    if (!staffUserId) {
      console.error("🚗 [Travel Legs GET] Cannot determine user ID - missing authentication")
      return NextResponse.json({ 
        error: "Authentication required",
        details: "Missing authentication headers (x-user-clerk-id or x-user-email). Please ensure you are signed in."
      }, { status: 401 })
    }
    
    // Note: appointmentId is used for FILTERING results, not for authentication
    // It allows finding legs related to a specific appointment

    const conditions: string[] = []
    const params: any[] = []
    let paramIndex = 0

    if (!includeDeleted) {
      conditions.push("is_deleted = 0")
    }

    // Filter by staff_user_id if we have it
    if (staffUserId) {
      conditions.push(`staff_user_id = @param${paramIndex}`)
      params.push(staffUserId)
      paramIndex++
    }
    
    // Also allow filtering by appointment_id (for finding legs related to a specific appointment)
    if (appointmentId) {
      conditions.push(`(appointment_id_from = @param${paramIndex} OR appointment_id_to = @param${paramIndex})`)
      params.push(appointmentId)
      paramIndex++
    }

    if (date) {
      // Filter by date (any leg that starts on this date)
      const startOfDay = `${date} 00:00:00`
      const endOfDay = `${date} 23:59:59`
      conditions.push(`start_timestamp >= @param${paramIndex} AND start_timestamp <= @param${paramIndex + 1}`)
      params.push(startOfDay, endOfDay)
      paramIndex += 2
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

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : ""

    const legs = await query(
      `SELECT 
        leg_id, staff_user_id, staff_name, journey_id, leg_sequence,
        start_latitude, start_longitude, start_timestamp, start_location_name, 
        start_location_address, start_location_type, appointment_id_from,
        end_latitude, end_longitude, end_timestamp, end_location_name,
        end_location_address, end_location_type, appointment_id_to,
        calculated_mileage, estimated_toll_cost, actual_toll_cost, duration_minutes,
        leg_status, is_final_leg, is_manual_entry, is_backdated,
        manual_mileage, manual_notes, travel_purpose, vehicle_type, reimbursable,
        created_at, updated_at
      FROM travel_legs
      ${whereClause}
      ORDER BY start_timestamp DESC, leg_sequence ASC`,
      params
    )

    // Calculate totals if filtering by date
    let totals = null
    if (date) {
      const totalResult = await query(
        `SELECT 
          COUNT(*) as total_legs,
          SUM(COALESCE(manual_mileage, calculated_mileage, 0)) as total_mileage,
          SUM(COALESCE(actual_toll_cost, estimated_toll_cost, 0)) as total_tolls,
          SUM(duration_minutes) as total_duration
        FROM travel_legs
        WHERE staff_user_id = @param0 
          AND start_timestamp >= @param1 
          AND start_timestamp <= @param2
          AND is_deleted = 0
          AND leg_status = 'completed'`,
        [staffUserId, `${date} 00:00:00`, `${date} 23:59:59`]
      )

      if (totalResult.length > 0) {
        totals = {
          total_legs: totalResult[0].total_legs || 0,
          total_mileage: parseFloat(totalResult[0].total_mileage || 0).toFixed(2),
          total_tolls: parseFloat(totalResult[0].total_tolls || 0).toFixed(2),
          total_duration: totalResult[0].total_duration || 0,
        }
      }
    }

    return NextResponse.json({
      success: true,
      count: legs.length,
      legs,
      totals,
    })
  } catch (error: any) {
    console.error("❌ [TRAVEL] Error fetching travel legs:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch travel legs",
        details: error.message || "Unknown error",
      },
      { status: 500 }
    )
  }
}

