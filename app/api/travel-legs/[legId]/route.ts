import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { getClerkUserIdFromRequest } from "@/lib/clerk-auth-helper"
import { calculateDrivingDistance } from "@/lib/route-calculator"
import { currentUser } from "@clerk/nextjs/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * PATCH - Complete a travel leg (add end point and calculate mileage)
 * 
 * Body: {
 *   end_latitude: number (required)
 *   end_longitude: number (required)
 *   end_timestamp: string (ISO datetime, required)
 *   end_location_name?: string
 *   end_location_address?: string
 *   end_location_type?: 'office' | 'appointment' | 'home' | 'other'
 *   appointment_id_to?: string (UUID)
 *   is_final_leg?: boolean
 * }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { legId: string } }
) {
  try {
    // Try to get auth from headers first (desktop/tablet)
    let auth = getClerkUserIdFromRequest(request)
    let authMethod = "headers"
    console.log("🚗 [Travel Legs PATCH] Auth from headers:", { clerkUserId: auth.clerkUserId, email: auth.email })
    
    // Fallback to Clerk session if headers not available (mobile - cookies are sent automatically)
    if (!auth.clerkUserId && !auth.email) {
      try {
        const user = await currentUser()
        if (user) {
          auth = {
            clerkUserId: user.id,
            email: user.emailAddresses[0]?.emailAddress || null,
            name: `${user.firstName || ""} ${user.lastName || ""}`.trim() || null,
          }
          authMethod = "clerk_session"
          console.log("🚗 [Travel Legs PATCH] Auth from Clerk session:", { clerkUserId: auth.clerkUserId, email: auth.email })
        } else {
          console.warn("🚗 [Travel Legs PATCH] currentUser() returned null")
        }
      } catch (clerkError) {
        console.error("🚗 [Travel Legs PATCH] Error getting user from Clerk session:", clerkError)
      }
    }
    
    if (!auth.clerkUserId && !auth.email) {
      console.error("🚗 [Travel Legs PATCH] Authentication failed - no clerkUserId or email")
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const { legId } = params
    const body = await request.json()
    const {
      end_latitude,
      end_longitude,
      end_timestamp,
      end_location_name,
      end_location_address,
      end_location_type,
      appointment_id_to,
      is_final_leg,
    } = body

    // Validate required fields
    if (end_latitude === undefined || end_longitude === undefined || !end_timestamp) {
      return NextResponse.json(
        { error: "Missing required fields: end_latitude, end_longitude, end_timestamp" },
        { status: 400 }
      )
    }

    // Get existing leg
    const existingLegs = await query(
      `SELECT leg_id, start_latitude, start_longitude, start_timestamp, leg_status
       FROM travel_legs
       WHERE leg_id = @param0 AND is_deleted = 0`,
      [legId]
    )

    if (existingLegs.length === 0) {
      return NextResponse.json({ error: "Travel leg not found" }, { status: 404 })
    }

    const leg = existingLegs[0]

    if (leg.leg_status !== "in_progress") {
      return NextResponse.json(
        { error: `Leg is already ${leg.leg_status}. Cannot complete.` },
        { status: 400 }
      )
    }

    // Calculate mileage
    let calculatedMileage = 0.00
    let estimatedToll: number | null = null
    let durationMinutes: number | null = null

    if (leg.start_latitude && leg.start_longitude) {
      try {
        const routeData = await calculateDrivingDistance(
          leg.start_latitude,
          leg.start_longitude,
          end_latitude,
          end_longitude
        )

        if (routeData) {
          calculatedMileage = routeData.distance
          estimatedToll = routeData.estimatedTollCost
        }
      } catch (routeError) {
        console.error("❌ [TRAVEL] Error calculating route:", routeError)
        // Continue with 0 mileage if calculation fails
      }
    }

    // Calculate duration
    try {
      const startTime = new Date(leg.start_timestamp).getTime()
      const endTime = new Date(end_timestamp).getTime()
      durationMinutes = Math.round((endTime - startTime) / (1000 * 60))
    } catch (durationError) {
      console.error("❌ [TRAVEL] Error calculating duration:", durationError)
    }

    // Update leg
    await query(
      `UPDATE travel_legs
       SET end_latitude = @param1,
           end_longitude = @param2,
           end_timestamp = @param3,
           end_location_name = @param4,
           end_location_address = @param5,
           end_location_type = @param6,
           appointment_id_to = @param7,
           calculated_mileage = @param8,
           estimated_toll_cost = @param9,
           duration_minutes = @param10,
           is_final_leg = @param11,
           leg_status = 'completed',
           updated_at = GETUTCDATE(),
           updated_by_user_id = @param12
       WHERE leg_id = @param0`,
      [
        legId,
        end_latitude,
        end_longitude,
        end_timestamp,
        end_location_name || null,
        end_location_address || null,
        end_location_type || null,
        appointment_id_to || null,
        calculatedMileage,
        estimatedToll,
        durationMinutes,
        is_final_leg || false,
        auth.clerkUserId || auth.email,
      ]
    )

    return NextResponse.json({
      success: true,
      message: "Travel leg completed",
      calculated_mileage: calculatedMileage,
      estimated_toll_cost: estimatedToll,
      duration_minutes: durationMinutes,
    })
  } catch (error: any) {
    console.error("❌ [TRAVEL] Error completing travel leg:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to complete travel leg",
        details: error.message || "Unknown error",
      },
      { status: 500 }
    )
  }
}

/**
 * DELETE - Cancel a travel leg
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { legId: string } }
) {
  try {
    // Try to get auth from headers first (desktop/tablet)
    let auth = getClerkUserIdFromRequest(request)
    
    // Fallback to Clerk session if headers not available (mobile - cookies are sent automatically)
    if (!auth.clerkUserId && !auth.email) {
      try {
        const user = await currentUser()
        if (user) {
          auth = {
            clerkUserId: user.id,
            email: user.emailAddresses[0]?.emailAddress || null,
            name: `${user.firstName || ""} ${user.lastName || ""}`.trim() || null,
          }
        }
      } catch (clerkError) {
        console.error("🚗 [Travel Legs DELETE] Error getting user from Clerk session:", clerkError)
      }
    }
    
    if (!auth.clerkUserId && !auth.email) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const { legId } = params

    await query(
      `UPDATE travel_legs
       SET leg_status = 'cancelled',
           updated_at = GETUTCDATE(),
           updated_by_user_id = @param1
       WHERE leg_id = @param0 AND is_deleted = 0`,
      [legId, auth.clerkUserId || auth.email]
    )

    return NextResponse.json({
      success: true,
      message: "Travel leg cancelled",
    })
  } catch (error: any) {
    console.error("❌ [TRAVEL] Error cancelling travel leg:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to cancel travel leg",
        details: error.message || "Unknown error",
      },
      { status: 500 }
    )
  }
}

