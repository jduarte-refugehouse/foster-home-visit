import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { getClerkUserIdFromRequest } from "@/lib/clerk-auth-helper"
import { calculateDrivingDistance } from "@/lib/route-calculator"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * POST - Create a travel leg via manual entry (for forgotten travel, corrections, etc.)
 * 
 * Body: {
 *   staff_user_id: string (required)
 *   start_location_name: string (required)
 *   start_address?: string
 *   start_latitude?: number (optional - will geocode if not provided)
 *   start_longitude?: number (optional - will geocode if not provided)
 *   start_timestamp: string (ISO datetime, required)
 *   end_location_name: string (required)
 *   end_address?: string
 *   end_latitude?: number (optional - will geocode if not provided)
 *   end_longitude?: number (optional - will geocode if not provided)
 *   end_timestamp: string (ISO datetime, required)
 *   manual_mileage?: number (override calculated mileage)
 *   manual_notes: string (required - explanation of manual entry)
 *   is_backdated: boolean (required)
 *   travel_purpose?: string
 *   vehicle_type?: string
 *   journey_id?: string (optional - add to existing journey)
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const auth = getClerkUserIdFromRequest(request)
    if (!auth.clerkUserId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const body = await request.json()
    const {
      staff_user_id,
      start_location_name,
      start_address,
      start_latitude,
      start_longitude,
      start_timestamp,
      end_location_name,
      end_address,
      end_latitude,
      end_longitude,
      end_timestamp,
      manual_mileage,
      manual_notes,
      is_backdated,
      travel_purpose,
      vehicle_type,
      journey_id,
    } = body

    // Validate required fields
    if (!staff_user_id || !start_location_name || !end_location_name || !start_timestamp || !end_timestamp || !manual_notes) {
      return NextResponse.json(
        { error: "Missing required fields: staff_user_id, start_location_name, end_location_name, start_timestamp, end_timestamp, manual_notes" },
        { status: 400 }
      )
    }

    // TODO: If coordinates not provided, geocode addresses using Google Geocoding API
    // For now, require coordinates
    if (!start_latitude || !start_longitude || !end_latitude || !end_longitude) {
      return NextResponse.json(
        { error: "Coordinates required for manual entry. Please provide start_latitude, start_longitude, end_latitude, end_longitude" },
        { status: 400 }
      )
    }

    // Generate journey_id if not provided
    const finalJourneyId = journey_id || crypto.randomUUID()

    // Get leg sequence
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

    // Calculate mileage (use manual if provided, otherwise calculate)
    let calculatedMileage = 0.00
    let estimatedToll: number | null = null

    if (manual_mileage !== undefined && manual_mileage !== null) {
      calculatedMileage = parseFloat(manual_mileage.toString())
    } else {
      try {
        const routeData = await calculateDrivingDistance(
          start_latitude,
          start_longitude,
          end_latitude,
          end_longitude
        )
        if (routeData) {
          calculatedMileage = routeData.distance
          estimatedToll = routeData.estimatedTollCost
        }
      } catch (routeError) {
        console.error("❌ [TRAVEL] Error calculating route for manual entry:", routeError)
        // Continue with 0 mileage if calculation fails
      }
    }

    // Calculate duration
    let durationMinutes: number | null = null
    try {
      const startTime = new Date(start_timestamp).getTime()
      const endTime = new Date(end_timestamp).getTime()
      durationMinutes = Math.round((endTime - startTime) / (1000 * 60))
    } catch (durationError) {
      console.error("❌ [TRAVEL] Error calculating duration:", durationError)
    }

    // Insert leg
    const result = await query(
      `INSERT INTO travel_legs (
        staff_user_id, journey_id, leg_sequence,
        start_latitude, start_longitude, start_timestamp,
        start_location_name, start_location_address,
        end_latitude, end_longitude, end_timestamp,
        end_location_name, end_location_address,
        calculated_mileage, estimated_toll_cost, duration_minutes,
        manual_mileage, manual_notes, is_manual_entry, is_backdated,
        travel_purpose, vehicle_type, leg_status, created_by_user_id
      )
      OUTPUT INSERTED.leg_id, INSERTED.created_at
      VALUES (
        @param0, @param1, @param2,
        @param3, @param4, @param5,
        @param6, @param7,
        @param8, @param9, @param10,
        @param11, @param12,
        @param13, @param14, @param15,
        @param16, @param17, 1, @param18,
        @param19, @param20, 'completed', @param21
      )`,
      [
        staff_user_id,
        finalJourneyId,
        legSequence,
        start_latitude,
        start_longitude,
        start_timestamp,
        start_location_name,
        start_address || null,
        end_latitude,
        end_longitude,
        end_timestamp,
        end_location_name,
        end_address || null,
        calculatedMileage,
        estimatedToll,
        durationMinutes,
        manual_mileage || null,
        manual_notes,
        is_backdated ? 1 : 0,
        travel_purpose || null,
        vehicle_type || null,
        auth.clerkUserId,
      ]
    )

    return NextResponse.json({
      success: true,
      leg_id: result[0].leg_id,
      journey_id: finalJourneyId,
      leg_sequence: legSequence,
      calculated_mileage: calculatedMileage,
      created_at: result[0].created_at,
    })
  } catch (error: any) {
    console.error("❌ [TRAVEL] Error creating manual travel leg:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create manual travel leg",
        details: error.message || "Unknown error",
      },
      { status: 500 }
    )
  }
}

