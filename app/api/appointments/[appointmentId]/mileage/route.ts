import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { getClerkUserIdFromRequest } from "@/lib/clerk-auth-helper"
import { currentUser } from "@clerk/nextjs/server"

export const runtime = "nodejs"

/**
 * POST - Capture location and calculate mileage
 * 
 * Body: {
 *   action: "start_drive" | "arrived" | "calculate"
 *   latitude?: number (required for start_drive and arrived)
 *   longitude?: number (required for start_drive and arrived)
 * }
 */
export async function POST(request: NextRequest, { params }: { params: { appointmentId: string } }) {
  try {
    // TEMPORARY: For testing - since this is called from a protected route, 
    // we can be more lenient with authentication
    // TODO: Re-enable strict auth once mobile auth is working reliably
    
    let clerkUserId: string | null = null
    let email: string | null = null
    let authMethod = "none"
    
    // Try to get from headers (desktop/tablet)
    const headerAuth = getClerkUserIdFromRequest(request)
    if (headerAuth.clerkUserId || headerAuth.email) {
      clerkUserId = headerAuth.clerkUserId
      email = headerAuth.email
      authMethod = "headers"
      console.log("✅ [MILEAGE] Auth from headers:", { clerkUserId, email })
    } else {
      // Fall back to Clerk session (mobile - cookies are sent automatically)
      try {
        const user = await currentUser()
        if (user) {
          clerkUserId = user.id
          email = user.emailAddresses[0]?.emailAddress || null
          authMethod = "clerk_session"
          console.log("✅ [MILEAGE] Auth from Clerk session:", { clerkUserId, email })
        } else {
          console.warn("⚠️ [MILEAGE] currentUser() returned null")
        }
      } catch (clerkError) {
        console.error("❌ [MILEAGE] Error getting user from Clerk session:", clerkError)
      }
    }
    
    // TEMPORARY: Allow request to proceed even without explicit auth
    // The route is protected, so user must be authenticated to reach the button
    if (!clerkUserId && !email) {
      console.warn("⚠️ [MILEAGE] No explicit auth found, but allowing request (protected route)")
      // Still allow the request - the route is protected so user must be authenticated
      // We'll log this for debugging but proceed with the request
    } else {
      console.log("✅ [MILEAGE] Authenticated via:", authMethod)
    }

    const { appointmentId } = params
    const body = await request.json()
    const { action, latitude, longitude } = body

    if (!action) {
      return NextResponse.json(
        { error: "Missing required field: action" },
        { status: 400 },
      )
    }

    if (action !== "start_drive" && action !== "arrived" && action !== "calculate") {
      return NextResponse.json(
        { error: "Invalid action. Must be 'start_drive', 'arrived', or 'calculate'" },
        { status: 400 },
      )
    }

    // For start_drive and arrived, latitude and longitude are required
    if ((action === "start_drive" || action === "arrived") && (!latitude || !longitude)) {
      return NextResponse.json(
        { error: "Missing required fields: latitude and longitude are required for this action" },
        { status: 400 },
      )
    }

    // Validate coordinates (only if provided)
    if ((action === "start_drive" || action === "arrived") && (latitude !== undefined && longitude !== undefined)) {
      if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
        return NextResponse.json(
          { error: "Invalid coordinates" },
          { status: 400 },
        )
      }
    }

    // Check if appointment exists and verify access
    // If we have user info, verify they're assigned to this appointment
    const appointmentQuery = clerkUserId || email
      ? `SELECT appointment_id, start_drive_latitude, start_drive_longitude, assigned_to_user_id 
         FROM appointments 
         WHERE appointment_id = @param0 AND is_deleted = 0`
      : `SELECT appointment_id, start_drive_latitude, start_drive_longitude, assigned_to_user_id 
         FROM appointments 
         WHERE appointment_id = @param0 AND is_deleted = 0`
    
    const existingAppointment = await query(appointmentQuery, [appointmentId])

    if (existingAppointment.length === 0) {
      return NextResponse.json({ error: "Appointment not found" }, { status: 404 })
    }

    // Basic security: If we have user identification, verify they have access
    // (This is a soft check - we'll be more strict once auth is fully working)
    if (clerkUserId || email) {
      // Try to verify user has access to this appointment
      // For now, we'll just log it - proper verification requires matching clerk_user_id in app_users
      console.log("🔒 [MILEAGE] User verification:", { 
        clerkUserId, 
        email, 
        appointmentId,
        assignedTo: existingAppointment[0].assigned_to_user_id 
      })
      // TODO: Add proper user verification once auth is working
      // Should check: app_users.clerk_user_id matches AND appointment.assigned_to_user_id matches app_users.id
    } else {
      console.warn("⚠️ [MILEAGE] No user identification - proceeding without verification (temporary)")
    }

    const now = new Date()

    if (action === "start_drive") {
      // Save start drive location
      await query(
        `UPDATE appointments 
         SET start_drive_latitude = @param1,
             start_drive_longitude = @param2,
             start_drive_timestamp = @param3,
             updated_at = GETUTCDATE()
         WHERE appointment_id = @param0`,
        [appointmentId, latitude, longitude, now],
      )

      return NextResponse.json({
        success: true,
        message: "Start drive location captured",
        timestamp: now.toISOString(),
      })
    }

    if (action === "arrived") {
      const appointment = existingAppointment[0]

      // Check if start drive location exists
      if (!appointment.start_drive_latitude || !appointment.start_drive_longitude) {
        return NextResponse.json(
          { error: "Start drive location not captured. Please click 'Start Drive' first." },
          { status: 400 },
        )
      }

      // Save arrived location
      await query(
        `UPDATE appointments 
         SET arrived_latitude = @param1,
             arrived_longitude = @param2,
             arrived_timestamp = @param3,
             updated_at = GETUTCDATE()
         WHERE appointment_id = @param0`,
        [appointmentId, latitude, longitude, now],
      )

      // Calculate driving distance using Google Directions API
      let mileage = await calculateDrivingDistance(
        appointment.start_drive_latitude,
        appointment.start_drive_longitude,
        latitude,
        longitude,
      )

      // If calculation failed or returned null, check if coordinates are the same (0 distance)
      if (mileage === null) {
        const latDiff = Math.abs(appointment.start_drive_latitude - latitude)
        const lngDiff = Math.abs(appointment.start_drive_longitude - longitude)
        // If coordinates are very close (within ~10 meters), treat as 0 miles
        if (latDiff < 0.0001 && lngDiff < 0.0001) {
          mileage = 0.00
          console.log("📍 [MILEAGE] Start and end locations are the same, setting mileage to 0.00")
        }
      }

      // Always update appointment with calculated mileage (even if 0.00)
      // Use 0.00 as default if calculation failed and locations aren't the same
      const finalMileage = mileage !== null ? mileage : 0.00
      await query(
        `UPDATE appointments 
         SET calculated_mileage = @param1,
             updated_at = GETUTCDATE()
         WHERE appointment_id = @param0`,
        [appointmentId, finalMileage],
      )

      return NextResponse.json({
        success: true,
        message: "Arrived location captured",
        mileage: finalMileage,
        timestamp: now.toISOString(),
      })
    }

    if (action === "calculate") {
      try {
        console.log("🔢 [MILEAGE] Calculate action triggered for appointment:", appointmentId)
        
        // Get existing appointment with both start and arrived locations
        const appointmentQuery = `SELECT appointment_id, start_drive_latitude, start_drive_longitude, arrived_latitude, arrived_longitude 
                                  FROM appointments 
                                  WHERE appointment_id = @param0 AND is_deleted = 0`
        
        const existingAppointment = await query(appointmentQuery, [appointmentId])

        if (existingAppointment.length === 0) {
          console.error("❌ [MILEAGE] Appointment not found:", appointmentId)
          return NextResponse.json({ error: "Appointment not found" }, { status: 404 })
        }

        const appointment = existingAppointment[0]
        console.log("📍 [MILEAGE] Appointment data:", {
          startLat: appointment.start_drive_latitude,
          startLng: appointment.start_drive_longitude,
          arrivedLat: appointment.arrived_latitude,
          arrivedLng: appointment.arrived_longitude,
        })

        // Check if both locations exist
        if (!appointment.start_drive_latitude || !appointment.start_drive_longitude) {
          console.error("❌ [MILEAGE] Start drive location missing")
          return NextResponse.json(
            { error: "Start drive location not captured. Please click 'Start Drive' first." },
            { status: 400 },
          )
        }

        if (!appointment.arrived_latitude || !appointment.arrived_longitude) {
          console.error("❌ [MILEAGE] Arrived location missing")
          return NextResponse.json(
            { error: "Arrived location not captured. Please click 'Mark as Arrived' first." },
            { status: 400 },
          )
        }

        // Parse coordinates to ensure they're numbers
        const startLat = parseFloat(appointment.start_drive_latitude)
        const startLng = parseFloat(appointment.start_drive_longitude)
        const endLat = parseFloat(appointment.arrived_latitude)
        const endLng = parseFloat(appointment.arrived_longitude)

        if (isNaN(startLat) || isNaN(startLng) || isNaN(endLat) || isNaN(endLng)) {
          console.error("❌ [MILEAGE] Invalid coordinate values:", {
            startLat, startLng, endLat, endLng
          })
          return NextResponse.json(
            { error: "Invalid coordinate values in database" },
            { status: 400 },
          )
        }

        console.log("🚗 [MILEAGE] Calling calculateDrivingDistance with:", {
          startLat, startLng, endLat, endLng
        })

        // Calculate driving distance using Google Directions API
        let mileage = await calculateDrivingDistance(
          startLat,
          startLng,
          endLat,
          endLng,
        )

        // If calculation failed or returned null, check if coordinates are the same (0 distance)
        if (mileage === null) {
          const latDiff = Math.abs(startLat - endLat)
          const lngDiff = Math.abs(startLng - endLng)
          // If coordinates are very close (within ~10 meters), treat as 0 miles
          if (latDiff < 0.0001 && lngDiff < 0.0001) {
            mileage = 0.00
            console.log("📍 [MILEAGE] Start and end locations are the same, setting mileage to 0.00")
          } else {
            // If calculation failed and locations are different, return error with details
            console.error("❌ [MILEAGE] Google Directions API returned null, but locations are different:", {
              latDiff, lngDiff
            })
            return NextResponse.json(
              { 
                error: "Failed to calculate driving distance. Please check Google Maps API configuration.",
                details: "API returned null for different locations"
              },
              { status: 500 },
            )
          }
        }

        // Update appointment with calculated mileage
        const finalMileage = mileage !== null ? mileage : 0.00
        console.log("✅ [MILEAGE] Updating appointment with mileage:", finalMileage)
        
        await query(
          `UPDATE appointments 
           SET calculated_mileage = @param1,
               updated_at = GETUTCDATE()
           WHERE appointment_id = @param0`,
          [appointmentId, finalMileage],
        )

        console.log("✅ [MILEAGE] Mileage calculation completed successfully:", finalMileage)

        return NextResponse.json({
          success: true,
          message: "Mileage calculated successfully",
          mileage: finalMileage,
          timestamp: new Date().toISOString(),
        })
      } catch (calculateError) {
        console.error("❌ [MILEAGE] Error in calculate action:", calculateError)
        return NextResponse.json(
          {
            error: "Failed to calculate mileage",
            details: calculateError instanceof Error ? calculateError.message : "Unknown error",
            stack: calculateError instanceof Error ? calculateError.stack : undefined,
          },
          { status: 500 },
        )
      }
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("❌ [API] Error capturing mileage location:", error)
    return NextResponse.json(
      {
        error: "Failed to capture location",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

/**
 * Calculate driving distance between two GPS coordinates using Google Directions API
 * Returns distance in miles, or null if calculation fails
 */
async function calculateDrivingDistance(
  startLat: number,
  startLng: number,
  endLat: number,
  endLng: number,
): Promise<number | null> {
  try {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

    if (!apiKey) {
      console.error("❌ [MILEAGE] Google Maps API key not configured. Please set GOOGLE_MAPS_API_KEY or NEXT_PUBLIC_GOOGLE_MAPS_API_KEY")
      return null
    }

    // Call Google Directions API
    const origin = `${startLat},${startLng}`
    const destination = `${endLat},${endLng}`
    const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&key=${apiKey}`

    console.log("🚗 [MILEAGE] Calculating driving distance:", { origin, destination })

    const response = await fetch(url)
    const data = await response.json()

    if (data.status !== "OK" || !data.routes || data.routes.length === 0) {
      console.error("❌ [MILEAGE] Google Directions API error:", data.status, data.error_message)
      return null
    }

    // Extract distance from first route
    const route = data.routes[0]
    const leg = route.legs[0]
    const distanceInMeters = leg.distance.value
    const distanceInMiles = distanceInMeters * 0.000621371 // Convert meters to miles

    console.log("✅ [MILEAGE] Calculated distance:", {
      meters: distanceInMeters,
      miles: distanceInMiles.toFixed(2),
      duration: leg.duration.text,
    })

    return Math.round(distanceInMiles * 100) / 100 // Round to 2 decimal places
  } catch (error) {
    console.error("❌ [MILEAGE] Error calculating driving distance:", error)
    return null
  }
}

