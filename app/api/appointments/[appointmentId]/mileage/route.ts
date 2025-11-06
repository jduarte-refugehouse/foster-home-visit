import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { requireClerkAuth } from "@/lib/clerk-auth-helper"

export const runtime = "nodejs"

/**
 * POST - Capture location and calculate mileage
 * 
 * Body: {
 *   action: "start_drive" | "arrived"
 *   latitude: number
 *   longitude: number
 * }
 */
export async function POST(request: NextRequest, { params }: { params: { appointmentId: string } }) {
  try {
    // Authentication - get from headers (set by client-side Clerk)
    try {
      requireClerkAuth(request)
    } catch (authError) {
      return NextResponse.json(
        {
          error: "Unauthorized",
          details: authError instanceof Error ? authError.message : "Missing authentication headers",
        },
        { status: 401 },
      )
    }

    const { appointmentId } = params
    const body = await request.json()
    const { action, latitude, longitude } = body

    if (!action || !latitude || !longitude) {
      return NextResponse.json(
        { error: "Missing required fields: action, latitude, longitude" },
        { status: 400 },
      )
    }

    if (action !== "start_drive" && action !== "arrived") {
      return NextResponse.json(
        { error: "Invalid action. Must be 'start_drive' or 'arrived'" },
        { status: 400 },
      )
    }

    // Validate coordinates
    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return NextResponse.json(
        { error: "Invalid coordinates" },
        { status: 400 },
      )
    }

    // Check if appointment exists
    const existingAppointment = await query(
      "SELECT appointment_id, start_drive_latitude, start_drive_longitude FROM appointments WHERE appointment_id = @param0 AND is_deleted = 0",
      [appointmentId],
    )

    if (existingAppointment.length === 0) {
      return NextResponse.json({ error: "Appointment not found" }, { status: 404 })
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
      const mileage = await calculateDrivingDistance(
        appointment.start_drive_latitude,
        appointment.start_drive_longitude,
        latitude,
        longitude,
      )

      // Update appointment with calculated mileage
      if (mileage !== null) {
        await query(
          `UPDATE appointments 
           SET calculated_mileage = @param1,
               updated_at = GETUTCDATE()
           WHERE appointment_id = @param0`,
          [appointmentId, mileage],
        )
      }

      return NextResponse.json({
        success: true,
        message: "Arrived location captured",
        mileage: mileage,
        timestamp: now.toISOString(),
      })
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

