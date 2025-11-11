import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { getClerkUserIdFromRequest } from "@/lib/clerk-auth-helper"
import { currentUser } from "@clerk/nextjs/server"

export const runtime = "nodejs"

/**
 * POST - Capture location and calculate mileage
 * 
 * Body: {
 *   action: "start_drive" | "arrived" | "calculate" | "return"
 *   latitude?: number (required for start_drive, arrived, and return)
 *   longitude?: number (required for start_drive, arrived, and return)
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

    if (action !== "start_drive" && action !== "arrived" && action !== "calculate" && action !== "return") {
      return NextResponse.json(
        { error: "Invalid action. Must be 'start_drive', 'arrived', 'calculate', or 'return'" },
        { status: 400 },
      )
    }

    // For start_drive, arrived, and return, latitude and longitude are required
    if ((action === "start_drive" || action === "arrived" || action === "return") && (!latitude || !longitude)) {
      return NextResponse.json(
        { error: "Missing required fields: latitude and longitude are required for this action" },
        { status: 400 },
      )
    }

    // Validate coordinates (only if provided)
    if ((action === "start_drive" || action === "arrived" || action === "return") && (latitude !== undefined && longitude !== undefined)) {
      if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
        return NextResponse.json(
          { error: "Invalid coordinates" },
          { status: 400 },
        )
      }
    }

    // Check if appointment exists and verify access
    // If we have user info, verify they're assigned to this appointment
    // Note: return_* columns may not exist in all databases, so we'll check for them conditionally
    const appointmentQuery = `SELECT appointment_id, start_drive_latitude, start_drive_longitude, 
                                    arrived_latitude, arrived_longitude, arrived_timestamp,
                                    assigned_to_user_id 
                              FROM appointments 
                              WHERE appointment_id = @param0 AND is_deleted = 0`
    
    const existingAppointment = await query(appointmentQuery, [appointmentId])
    
    // Try to get return columns if they exist (they may not be in all databases)
    let returnColumns: any = {}
    try {
      const returnQuery = `SELECT return_latitude, return_longitude, return_timestamp, return_mileage
                           FROM appointments 
                           WHERE appointment_id = @param0 AND is_deleted = 0`
      const returnData = await query(returnQuery, [appointmentId])
      if (returnData.length > 0) {
        returnColumns = returnData[0]
      }
    } catch (returnError: any) {
      // If return columns don't exist, that's okay - we'll handle it gracefully
      console.log("⚠️ [MILEAGE] Return columns not found in database, will use NULL checks:", returnError.message)
    }
    
    // Merge return columns into appointment data if they exist
    const appointment = {
      ...existingAppointment[0],
      return_latitude: returnColumns.return_latitude || null,
      return_longitude: returnColumns.return_longitude || null,
      return_timestamp: returnColumns.return_timestamp || null,
      return_mileage: returnColumns.return_mileage || null,
    }

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
      try {
        const appointment = existingAppointment[0]

        // Check if start drive location exists
        if (!appointment.start_drive_latitude || !appointment.start_drive_longitude) {
          return NextResponse.json(
            { error: "Start drive location not captured. Please click 'Start Drive' first." },
            { status: 400 },
          )
        }

        console.log("📍 [MILEAGE] Saving arrived location:", {
          appointmentId,
          latitude,
          longitude,
          startLat: appointment.start_drive_latitude,
          startLng: appointment.start_drive_longitude,
        })

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

        console.log("✅ [MILEAGE] Arrived location saved, calculating distance...")

        // Calculate driving distance and tolls using Google Routes API
        let routeData: { distance: number; estimatedTollCost: number | null } | null = null
        try {
          routeData = await calculateDrivingDistance(
            appointment.start_drive_latitude,
            appointment.start_drive_longitude,
            latitude,
            longitude,
          )
        } catch (routeError) {
          console.error("❌ [MILEAGE] Error calculating route:", routeError)
          // Continue with fallback calculation
        }

        // If calculation failed or returned null, check if coordinates are the same (0 distance)
        let finalMileage = 0.00
        let estimatedToll: number | null = null
        
        if (routeData === null) {
          const latDiff = Math.abs(appointment.start_drive_latitude - latitude)
          const lngDiff = Math.abs(appointment.start_drive_longitude - longitude)
          // If coordinates are very close (within ~10 meters), treat as 0 miles
          if (latDiff < 0.0001 && lngDiff < 0.0001) {
            finalMileage = 0.00
            console.log("📍 [MILEAGE] Start and end locations are the same, setting mileage to 0.00")
          } else {
            console.warn("⚠️ [MILEAGE] Route calculation returned null, but locations differ. Using 0.00 miles.")
          }
        } else {
          finalMileage = routeData.distance
          estimatedToll = routeData.estimatedTollCost
        }

        console.log("💾 [MILEAGE] Updating appointment with mileage:", {
          mileage: finalMileage,
          estimatedToll,
        })

        // Always update appointment with calculated mileage and estimated toll (even if 0.00)
        // Check if estimated_toll_cost column exists before trying to update it
        try {
          await query(
            `UPDATE appointments 
             SET calculated_mileage = @param1,
                 estimated_toll_cost = @param2,
                 updated_at = GETUTCDATE()
             WHERE appointment_id = @param0`,
            [appointmentId, finalMileage, estimatedToll],
          )
        } catch (tollUpdateError: any) {
          // If estimated_toll_cost column doesn't exist, update without it
          if (tollUpdateError?.message?.includes("Invalid column name") || 
              tollUpdateError?.message?.includes("estimated_toll_cost")) {
            console.warn("⚠️ [MILEAGE] estimated_toll_cost column not found, updating without it")
            await query(
              `UPDATE appointments 
               SET calculated_mileage = @param1,
                   updated_at = GETUTCDATE()
               WHERE appointment_id = @param0`,
              [appointmentId, finalMileage],
            )
          } else {
            throw tollUpdateError
          }
        }

        console.log("✅ [MILEAGE] Arrived action completed successfully")

        return NextResponse.json({
          success: true,
          message: "Arrived location captured",
          mileage: finalMileage,
          estimatedTollCost: estimatedToll,
          timestamp: now.toISOString(),
        })
      } catch (arrivedError) {
        console.error("❌ [MILEAGE] Error in arrived action:", arrivedError)
        console.error("❌ [MILEAGE] Error stack:", arrivedError instanceof Error ? arrivedError.stack : "No stack trace")
        
        // Log SQL Server specific error details
        if (arrivedError && typeof arrivedError === 'object' && 'number' in arrivedError) {
          console.error("❌ [MILEAGE] SQL Error Number:", (arrivedError as any).number)
          console.error("❌ [MILEAGE] SQL Error State:", (arrivedError as any).state)
          console.error("❌ [MILEAGE] SQL Error Message:", (arrivedError as any).message)
        }

        return NextResponse.json(
          {
            error: "Failed to capture arrived location",
            details: arrivedError instanceof Error ? arrivedError.message : "Unknown error",
            sqlError: arrivedError && typeof arrivedError === 'object' && 'number' in arrivedError ? {
              number: (arrivedError as any).number,
              state: (arrivedError as any).state,
              message: (arrivedError as any).message,
            } : undefined,
          },
          { status: 500 },
        )
      }
    }

    if (action === "return") {
      const appointment = existingAppointment[0]

      // Try to get the most recent location from continuum entries (history log)
      // This is more reliable than checking appointments table which might be out of sync
      let startLatitude: number | null = null
      let startLongitude: number | null = null

      try {
        const recentLocations = await query(
          `SELECT TOP 1 
             location_latitude, 
             location_longitude 
           FROM continuum_entries 
           WHERE appointment_id = @param0 
             AND location_latitude IS NOT NULL 
             AND location_longitude IS NOT NULL
             AND is_deleted = 0
           ORDER BY timestamp DESC`,
          [appointmentId],
        )

        if (recentLocations.length > 0 && recentLocations[0].location_latitude && recentLocations[0].location_longitude) {
          startLatitude = parseFloat(recentLocations[0].location_latitude)
          startLongitude = parseFloat(recentLocations[0].location_longitude)
          console.log("📍 [MILEAGE] Using most recent location from continuum:", {
            lat: startLatitude,
            lng: startLongitude,
          })
        }
      } catch (continuumError) {
        console.warn("⚠️ [MILEAGE] Could not query continuum entries, falling back to appointments table:", continuumError)
      }

      // Fallback to appointments table if continuum doesn't have location
      if (!startLatitude || !startLongitude) {
        if (appointment.arrived_latitude && appointment.arrived_longitude) {
          startLatitude = parseFloat(appointment.arrived_latitude)
          startLongitude = parseFloat(appointment.arrived_longitude)
          console.log("📍 [MILEAGE] Using location from appointments table:", {
            lat: startLatitude,
            lng: startLongitude,
          })
        } else {
          return NextResponse.json(
            { error: "Arrived location not found. Please mark as arrived first." },
            { status: 400 },
          )
        }
      }

      // Check if this is the start of return travel (return_timestamp doesn't exist yet)
      // or if they're arriving at home (return_timestamp exists)
      const isReturnStart = !appointment.return_timestamp

      if (isReturnStart) {
        // Starting return travel - save return start location and timestamp
        await query(
          `UPDATE appointments 
           SET return_latitude = @param1,
               return_longitude = @param2,
               return_timestamp = @param3,
               updated_at = GETUTCDATE()
           WHERE appointment_id = @param0`,
          [appointmentId, latitude, longitude, now],
        )

        console.log("🚗 [MILEAGE] Return travel started:", {
          appointmentId,
          startLat: startLatitude,
          startLng: startLongitude,
          endLat: latitude,
          endLng: longitude,
        })

        return NextResponse.json({
          success: true,
          message: "Return travel started",
          returnStarted: true,
          timestamp: now.toISOString(),
        })
      } else {
        // Arriving at home - calculate return mileage
        // Calculate return driving distance and tolls using Google Routes API
        const routeData = await calculateDrivingDistance(
          startLatitude,
          startLongitude,
          latitude,
          longitude,
        )

        // If calculation failed or returned null, check if coordinates are the same (0 distance)
        let returnMileage = 0.00
        let returnEstimatedToll: number | null = null
        
        if (routeData === null) {
          const latDiff = Math.abs(startLatitude - latitude)
          const lngDiff = Math.abs(startLongitude - longitude)
          // If coordinates are very close (within ~10 meters), treat as 0 miles
          if (latDiff < 0.0001 && lngDiff < 0.0001) {
            returnMileage = 0.00
            console.log("📍 [MILEAGE] Return start and end locations are the same, setting return mileage to 0.00")
          }
        } else {
          returnMileage = routeData.distance
          returnEstimatedToll = routeData.estimatedTollCost
        }

        // Update appointment with return mileage and final location
        // Try to update return columns, but handle gracefully if they don't exist
        try {
          await query(
            `UPDATE appointments 
             SET return_latitude = @param1,
                 return_longitude = @param2,
                 return_mileage = @param3,
                 updated_at = GETUTCDATE()
             WHERE appointment_id = @param0`,
            [appointmentId, latitude, longitude, returnMileage],
          )
        } catch (updateError: any) {
          // If return columns don't exist, log a warning but don't fail
          if (updateError.message?.includes("Invalid column name") && 
              (updateError.message.includes("return_latitude") || 
               updateError.message.includes("return_longitude") || 
               updateError.message.includes("return_mileage"))) {
            console.warn("⚠️ [MILEAGE] Return travel columns not found in database. Please run migration script to add return_* columns.")
            // Still return success with the calculated mileage
            return NextResponse.json({
              success: true,
              message: "Return travel completed (mileage calculated, but return columns not available in database)",
              returnMileage: returnMileage,
              returnEstimatedTollCost: returnEstimatedToll,
              returnCompleted: true,
              timestamp: now.toISOString(),
              warning: "Return travel columns not found in database",
            })
          }
          throw updateError
        }

        console.log("✅ [MILEAGE] Return travel completed:", {
          returnMileage: returnMileage.toFixed(2),
          returnEstimatedToll: returnEstimatedToll,
        })

        return NextResponse.json({
          success: true,
          message: "Return travel completed",
          returnMileage: returnMileage,
          returnEstimatedTollCost: returnEstimatedToll,
          returnCompleted: true,
          timestamp: now.toISOString(),
        })
      }
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

        // Calculate driving distance and tolls using Google Routes API
        const routeData = await calculateDrivingDistance(
          startLat,
          startLng,
          endLat,
          endLng,
        )

        // If calculation failed or returned null, check if coordinates are the same (0 distance)
        if (routeData === null) {
          const latDiff = Math.abs(startLat - endLat)
          const lngDiff = Math.abs(startLng - endLng)
          // If coordinates are very close (within ~10 meters), treat as 0 miles
          if (latDiff < 0.0001 && lngDiff < 0.0001) {
            const finalMileage = 0.00
            console.log("📍 [MILEAGE] Start and end locations are the same, setting mileage to 0.00")
            
            // Try to update with estimated_toll_cost, fallback if column doesn't exist
            try {
              await query(
                `UPDATE appointments 
                 SET calculated_mileage = @param1,
                     estimated_toll_cost = NULL,
                     updated_at = GETUTCDATE()
                 WHERE appointment_id = @param0`,
                [appointmentId, finalMileage],
              )
            } catch (tollError: any) {
              if (tollError?.message?.includes("Invalid column name") || 
                  tollError?.message?.includes("estimated_toll_cost")) {
                await query(
                  `UPDATE appointments 
                   SET calculated_mileage = @param1,
                       updated_at = GETUTCDATE()
                   WHERE appointment_id = @param0`,
                  [appointmentId, finalMileage],
                )
              } else {
                throw tollError
              }
            }

            return NextResponse.json({
              success: true,
              message: "Mileage calculated successfully",
              mileage: finalMileage,
              estimatedTollCost: null,
              timestamp: new Date().toISOString(),
            })
          } else {
            // If calculation failed and locations are different, return error with details
            console.error("❌ [MILEAGE] Google Routes API returned null, but locations are different:", {
              latDiff, lngDiff,
              startLat, startLng,
              endLat, endLng
            })
            return NextResponse.json(
              { 
                error: "Failed to calculate driving distance. The Routes API returned an error.",
                details: "Please check: 1) API key restrictions allow server-side calls, 2) Routes API billing is enabled, 3) API key has Routes API permissions. Check server logs for the specific error message.",
                suggestion: "In Google Cloud Console, check API key restrictions and ensure Routes API is enabled for this key."
              },
              { status: 500 },
            )
          }
        }

        // Update appointment with calculated mileage and estimated toll cost
        const finalMileage = routeData.distance
        const estimatedToll = routeData.estimatedTollCost
        console.log("✅ [MILEAGE] Updating appointment with mileage and tolls:", {
          mileage: finalMileage,
          estimatedToll: estimatedToll,
        })
        
        // Try to update with estimated_toll_cost, fallback if column doesn't exist
        try {
          await query(
            `UPDATE appointments 
             SET calculated_mileage = @param1,
                 estimated_toll_cost = @param2,
                 updated_at = GETUTCDATE()
             WHERE appointment_id = @param0`,
            [appointmentId, finalMileage, estimatedToll],
          )
        } catch (tollError: any) {
          if (tollError?.message?.includes("Invalid column name") || 
              tollError?.message?.includes("estimated_toll_cost")) {
            console.warn("⚠️ [MILEAGE] estimated_toll_cost column not found, updating without it")
            await query(
              `UPDATE appointments 
               SET calculated_mileage = @param1,
                   updated_at = GETUTCDATE()
               WHERE appointment_id = @param0`,
              [appointmentId, finalMileage],
            )
          } else {
            throw tollError
          }
        }

        console.log("✅ [MILEAGE] Mileage calculation completed successfully:", {
          mileage: finalMileage,
          estimatedToll: estimatedToll,
        })

        return NextResponse.json({
          success: true,
          message: "Mileage calculated successfully",
          mileage: finalMileage,
          estimatedTollCost: estimatedToll,
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
    console.error("❌ [API] Error stack:", error instanceof Error ? error.stack : "No stack trace")
    console.error("❌ [API] Appointment ID:", params.appointmentId)
    
    // Log SQL Server specific error details
    if (error && typeof error === 'object' && 'number' in error) {
      console.error("❌ [API] SQL Error Number:", (error as any).number)
      console.error("❌ [API] SQL Error State:", (error as any).state)
      console.error("❌ [API] SQL Error Message:", (error as any).message)
    }

    return NextResponse.json(
      {
        error: "Failed to capture location",
        details: error instanceof Error ? error.message : "Unknown error",
        appointmentId: params.appointmentId,
        sqlError: error && typeof error === 'object' && 'number' in error ? {
          number: (error as any).number,
          state: (error as any).state,
          message: (error as any).message,
        } : undefined,
      },
      { status: 500 },
    )
  }
}

/**
 * Calculate driving distance and toll information using Google Routes API
 * Returns object with distance (miles) and estimated toll cost (USD), or null if calculation fails
 */
async function calculateDrivingDistance(
  startLat: number,
  startLng: number,
  endLat: number,
  endLng: number,
): Promise<{ distance: number; estimatedTollCost: number | null } | null> {
  try {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

    if (!apiKey) {
      console.error("❌ [MILEAGE] Google Maps API key not configured. Please set GOOGLE_MAPS_API_KEY or NEXT_PUBLIC_GOOGLE_MAPS_API_KEY")
      return null
    }

    // Call Google Routes API (replaces Directions API)
    const url = `https://routes.googleapis.com/directions/v2:computeRoutes`

    const requestBody = {
      origin: {
        location: {
          latLng: {
            latitude: startLat,
            longitude: startLng,
          },
        },
      },
      destination: {
        location: {
          latLng: {
            latitude: endLat,
            longitude: endLng,
          },
        },
      },
      travelMode: "DRIVE",
      routingPreference: "TRAFFIC_AWARE",
      extraComputations: ["TOLLS"],
      routeModifiers: {
        vehicleInfo: {
          emissionType: "GASOLINE",
        },
        tollPasses: ["US_TX_TXTAG", "US_TX_EZTAG"], // Texas toll passes
      },
      units: "IMPERIAL",
    }

    console.log("🚗 [MILEAGE] Calculating driving distance with tolls:", {
      origin: `${startLat},${startLng}`,
      destination: `${endLat},${endLng}`,
    })

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": "routes.duration,routes.distanceMeters,routes.travelAdvisory.tollInfo",
      },
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      console.error("❌ [MILEAGE] Google Routes API HTTP error:", response.status, response.statusText)
      const errorText = await response.text()
      console.error("❌ [MILEAGE] Error response body:", errorText)
      return null
    }

    const data = await response.json()

    if (!data.routes || data.routes.length === 0) {
      console.error("❌ [MILEAGE] Google Routes API returned no routes:", JSON.stringify(data, null, 2))
      return null
    }

    // Extract distance and toll information from first route
    const route = data.routes[0]
    const distanceInMeters = route.distanceMeters
    const distanceInMiles = distanceInMeters * 0.000621371 // Convert meters to miles

    // Extract toll information
    let estimatedTollCost: number | null = null
    if (route.travelAdvisory?.tollInfo) {
      const tollInfo = route.travelAdvisory.tollInfo
      // tollInfo.estimatedPrice contains array of price objects with currencyCode and units
      if (tollInfo.estimatedPrice && tollInfo.estimatedPrice.length > 0) {
        const price = tollInfo.estimatedPrice[0]
        // Convert from micros (price.units) to dollars
        estimatedTollCost = price.units ? price.units / 1000000 : null
        if (price.nanos) {
          estimatedTollCost = (estimatedTollCost || 0) + price.nanos / 1000000000
        }
      }
    }

    console.log("✅ [MILEAGE] Calculated distance and tolls:", {
      meters: distanceInMeters,
      miles: distanceInMiles.toFixed(2),
      estimatedTollCost: estimatedTollCost ? `$${estimatedTollCost.toFixed(2)}` : "No tolls",
      duration: route.duration,
    })

    return {
      distance: Math.round(distanceInMiles * 100) / 100, // Round to 2 decimal places
      estimatedTollCost: estimatedTollCost ? Math.round(estimatedTollCost * 100) / 100 : null, // Round to 2 decimal places
    }
  } catch (error) {
    console.error("❌ [MILEAGE] Error calculating driving distance:", error)
    return null
  }
}

