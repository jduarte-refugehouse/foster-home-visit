import { type NextRequest, NextResponse } from "next/server"
import { query } from "@refugehouse/shared-core/db"
import { getClerkUserIdFromRequest } from "@refugehouse/shared-core/auth"
import { calculateDrivingDistance } from "@refugehouse/shared-core/route-calculator"
import { shouldUseRadiusApiClient, throwIfDirectDbNotAllowed } from "@/lib/microservice-config"
import { radiusApiClient } from "@refugehouse/radius-api-client"

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

    // NO DIRECT DB ACCESS - validation is handled by API Hub
    // The API Hub will return 404 if leg doesn't exist and 400 if leg is not in_progress

    const useApiClient = shouldUseRadiusApiClient()

    // NO DB FALLBACK - must use API client
    if (!useApiClient) {
      throwIfDirectDbNotAllowed("travel-legs/[legId] PATCH endpoint")
    }

    // Use API client to complete travel leg
    console.log("✅ [TRAVEL] Using API client to complete travel leg")
    const completeData = {
      end_latitude,
      end_longitude,
      end_timestamp,
      end_location_name,
      end_location_address,
      end_location_type,
      appointment_id_to,
      is_final_leg,
      updated_by_user_id: authInfo.clerkUserId || authInfo.email,
    }

    const apiResult = await radiusApiClient.completeTravelLeg(legId, completeData)
    const calculatedMileage = apiResult.calculated_mileage
    const estimatedToll = apiResult.estimated_toll_cost
    const durationMinutes = apiResult.duration_minutes

    // NO DIRECT DB ACCESS - The API Hub handles:
    // 1. Appointment return_mileage updates (for return legs)
    // 2. Continuum entry logging (drive_end)
    // All of this is done in the API Hub endpoint

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
        
        // NO DIRECT DB ACCESS - cannot query leg for auth info
        // User must provide auth via headers or token
        console.warn("⚠️ [Travel Legs DELETE] Session exists but no auth headers - cannot query leg for user info")
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
    const useApiClient = shouldUseRadiusApiClient()

    // NO DB FALLBACK - must use API client
    if (!useApiClient) {
      throwIfDirectDbNotAllowed("travel-legs/[legId] DELETE endpoint")
    }

    // Use API client to cancel travel leg
    console.log("✅ [TRAVEL] Using API client to cancel travel leg")
    await radiusApiClient.cancelTravelLeg(legId, authInfo.clerkUserId || authInfo.email || undefined)

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

