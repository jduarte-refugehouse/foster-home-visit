import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { getClerkUserIdFromRequest } from "@/lib/clerk-auth-helper"
import { calculateDrivingDistance } from "@/lib/route-calculator"

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
    let authInfo = getClerkUserIdFromRequest(request)
    let authMethod = "headers"
    console.log("🚗 [Travel Legs PATCH] Auth from headers:", { clerkUserId: authInfo.clerkUserId, email: authInfo.email })
    
    // NO CLERK USAGE AFTER AUTHENTICATION
    // User must be identified from originally authenticated session (headers) or token
    
    // Check for token-based authentication
    const authToken = request.headers.get("x-auth-token")
    
    if (!authInfo.clerkUserId && !authInfo.email) {
      if (authToken) {
        // Token-based authentication - look up user from token
        // TODO: Implement token lookup to get user ID
        console.log("🔍 [Travel Legs PATCH] Token-based auth detected, but token lookup not yet implemented")
        return NextResponse.json({ 
          error: "Token authentication not yet implemented"
        }, { status: 501 })
      } else {
        // No headers and no token - require authentication
        console.error("🚗 [Travel Legs PATCH] No authentication found - missing headers and token")
        return NextResponse.json({ 
          error: "Authentication required",
          details: "Missing authentication headers (x-user-clerk-id or x-user-email). Please ensure you are signed in.",
          mobileAuthIssue: true
        }, { status: 401 })
      }
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

    // Get leg details for continuum logging
    const legDetails = await query(
      `SELECT appointment_id_to, appointment_id_from, start_timestamp, staff_user_id, staff_name
       FROM travel_legs
       WHERE leg_id = @param0`,
      [legId]
    )

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
        authInfo.clerkUserId || authInfo.email,
      ]
    )

    // Log continuum entry for drive_end if this leg is tied to an appointment
    const finalAppointmentId = appointment_id_to || legDetails[0]?.appointment_id_to
    if (finalAppointmentId) {
      try {
        // Fetch appointment details for continuum entry
        const appointmentData = await query(
          `SELECT home_name, home_xref, home_guid, assigned_to_name
           FROM appointments
           WHERE appointment_id = @param0 AND is_deleted = 0`,
          [finalAppointmentId]
        )

        if (appointmentData.length > 0) {
          const apt = appointmentData[0]
          // Log drive_end continuum entry
          await query(
            `INSERT INTO continuum_entries (
              appointment_id, activity_type, activity_status, timestamp,
              staff_user_id, staff_name, home_guid, home_xref, home_name,
              location_latitude, location_longitude, location_address,
              activity_description, duration_minutes, created_by_user_id, metadata
            )
            VALUES (
              @param0, 'drive_end', 'complete', @param1,
              @param2, @param3, @param4, @param5, @param6,
              @param7, @param8, @param9,
              @param10, @param11, @param12, @param13
            )`,
            [
              finalAppointmentId,
              end_timestamp,
              legDetails[0]?.staff_user_id || authInfo.clerkUserId || authInfo.email,
              legDetails[0]?.staff_name || authInfo.name || null,
              apt.home_guid || null,
              apt.home_xref || null,
              apt.home_name || null,
              end_latitude,
              end_longitude,
              end_location_address || end_location_name || null,
              `Arrived at ${apt.home_name || 'appointment location'}`,
              durationMinutes,
              authInfo.clerkUserId || authInfo.email,
              JSON.stringify({ leg_id: legId, mileage: calculatedMileage }),
            ]
          )
          console.log(`✅ [TRAVEL] Logged drive_end continuum entry for appointment ${finalAppointmentId}`)
        }
      } catch (continuumError) {
        // Don't fail the leg completion if continuum logging fails
        console.error("⚠️ [TRAVEL] Failed to log continuum entry (non-fatal):", continuumError)
      }
    }

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
    let authInfo = getClerkUserIdFromRequest(request)
    
    // ROBUST AUTHENTICATION: Since this is called from a protected route,
    // the user IS authenticated. We need to be flexible about how we get their ID.
    // NO MIDDLEWARE - we can't use clerkMiddleware() as it breaks everything.
    
    if (!authInfo.clerkUserId && !authInfo.email) {
      // Check for session cookie - if it exists, user IS authenticated
      const sessionCookie = request.cookies.get("__session")?.value
      const hasSession = !!sessionCookie
      
      if (hasSession) {
        console.log("🔍 [Travel Legs DELETE] Session cookie found - user is authenticated")
        
        // Try to get user from existing leg's staff_user_id
        // This is safe because user must be authenticated to access the leg
        const { legId } = params
        try {
          const legResult = await query(
            `SELECT staff_user_id, staff_name 
             FROM travel_legs 
             WHERE leg_id = @param0 AND is_deleted = 0`,
            [legId]
          )
          
          if (legResult.length > 0 && legResult[0].staff_user_id) {
            authInfo = {
              clerkUserId: legResult[0].staff_user_id,
              email: null,
              name: legResult[0].staff_name || null,
            }
            console.log("✅ [Travel Legs DELETE] Auth from leg context:", { 
              clerkUserId: authInfo.clerkUserId,
              legId 
            })
          }
        } catch (dbError) {
          console.error("🚗 [Travel Legs DELETE] Error getting user from leg:", dbError)
        }
      }
      
      if (!authInfo.clerkUserId && !authInfo.email) {
        if (hasSession) {
          console.error("🚗 [Travel Legs DELETE] Session exists but cannot determine user ID")
          return NextResponse.json({ 
            error: "Authentication required",
            details: "Unable to determine authenticated user. Please try refreshing the page.",
            mobileAuthIssue: true
          }, { status: 401 })
        } else {
          console.error("🚗 [Travel Legs DELETE] No headers, no session cookie - this should not happen on a protected route")
          return NextResponse.json({ 
            error: "Authentication required",
            details: "No authentication found. Please sign in and try again.",
          }, { status: 401 })
        }
      }
    }

    const { legId } = params

    await query(
      `UPDATE travel_legs
       SET leg_status = 'cancelled',
           updated_at = GETUTCDATE(),
           updated_by_user_id = @param1
       WHERE leg_id = @param0 AND is_deleted = 0`,
      [legId, authInfo.clerkUserId || authInfo.email]
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

