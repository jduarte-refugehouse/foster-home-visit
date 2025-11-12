import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { getClerkUserIdFromRequest } from "@/lib/clerk-auth-helper"
import { currentUser } from "@clerk/nextjs/server"

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
    
    // Fallback to Clerk session if headers not available (mobile - cookies are sent automatically)
    if (!authInfo.clerkUserId && !authInfo.email) {
      try {
        // Try currentUser() - this reads from Clerk session cookies
        const user = await currentUser()
        if (user) {
          authInfo = {
            clerkUserId: user.id,
            email: user.emailAddresses[0]?.emailAddress || null,
            name: `${user.firstName || ""} ${user.lastName || ""}`.trim() || null,
          }
          authMethod = "clerk_session"
          console.log("🚗 [Travel Legs POST] Auth from Clerk currentUser():", { clerkUserId: authInfo.clerkUserId, email: authInfo.email })
        } else {
          // If currentUser() returns null, check if we can get session from cookies
          // Clerk stores session in __session cookie
          const sessionCookie = request.cookies.get("__session")?.value
          if (sessionCookie) {
            console.warn("🚗 [Travel Legs POST] currentUser() returned null but __session cookie exists - Clerk session may not be fully initialized")
            // Since route is protected, user must be authenticated
            // But we can't proceed without a user ID
          } else {
            console.warn("🚗 [Travel Legs POST] currentUser() returned null and no __session cookie found")
          }
        }
      } catch (clerkError) {
        console.error("🚗 [Travel Legs POST] Error getting user from Clerk session:", clerkError)
      }
    }
    
    if (!authInfo.clerkUserId && !authInfo.email) {
      console.error("🚗 [Travel Legs POST] Authentication failed - no clerkUserId or email")
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const body = await request.json()
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

    // Use authenticated user ID from Clerk session (prefer clerkUserId, fallback to email)
    const staff_user_id = authInfo.clerkUserId || authInfo.email

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
    
    // Fallback to Clerk session if headers not available (mobile - cookies are sent automatically)
    if (!authInfo.clerkUserId && !authInfo.email) {
      try {
        const user = await currentUser()
        if (user) {
          authInfo = {
            clerkUserId: user.id,
            email: user.emailAddresses[0]?.emailAddress || null,
            name: `${user.firstName || ""} ${user.lastName || ""}`.trim() || null,
          }
        }
      } catch (clerkError) {
        console.error("🚗 [Travel Legs GET] Error getting user from Clerk session:", clerkError)
      }
    }
    
    if (!authInfo.clerkUserId && !authInfo.email) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const date = searchParams.get("date")
    const journeyId = searchParams.get("journeyId")
    const status = searchParams.get("status")
    const includeDeleted = searchParams.get("includeDeleted") === "true"
    // Allow filtering by specific staffUserId for admin purposes, but default to authenticated user
    const staffUserId = searchParams.get("staffUserId") || authInfo.clerkUserId || authInfo.email

    const conditions: string[] = []
    const params: any[] = []
    let paramIndex = 0

    if (!includeDeleted) {
      conditions.push("is_deleted = 0")
    }

    // Always filter by staff_user_id (defaults to authenticated user)
    conditions.push(`staff_user_id = @param${paramIndex}`)
    params.push(staffUserId)
    paramIndex++

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

