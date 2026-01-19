import { type NextRequest, NextResponse } from "next/server"
import { shouldUseRadiusApiClient, throwIfDirectDbNotAllowed } from "@/lib/microservice-config"
import { radiusApiClient } from "@refugehouse/radius-api-client"
import { query } from "@refugehouse/shared-core/db"
import { logCommunication, updateCommunicationStatus, getMicroserviceId } from "@refugehouse/shared-core/communication"
import { getClerkUserIdFromRequest } from "@refugehouse/shared-core/auth"

export const runtime = "nodejs"

/**
 * POST - Send appointment link via SMS to assigned staff member
 * Requires authentication and checks for phone number in app_users table
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { appointmentId: string } }
) {
  let logId: string | null = null

  try {
    const { appointmentId } = params
    const auth = getClerkUserIdFromRequest(request)

    if (!auth.clerkUserId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    // Parse request body for optional recipient override
    let recipientOverride: { clerkUserId?: string; phone?: string; name?: string } | null = null
    try {
      const body = await request.json()
      if (body && (body.recipientClerkUserId || body.recipientPhone)) {
        recipientOverride = {
          clerkUserId: body.recipientClerkUserId,
          phone: body.recipientPhone,
          name: body.recipientName,
        }
      }
    } catch (e) {
      // No body provided or invalid JSON, use default behavior
      console.log("No recipient override provided, using assigned staff member")
    }

    // Get appointment details - use API client for visit service
    const useApiClient = shouldUseRadiusApiClient()
    let appointment: any = null

    if (useApiClient) {
      // Use API client for visit service
      console.log("✅ [SEND-LINK] Using API client to fetch appointment")
      try {
        appointment = await radiusApiClient.getAppointment(appointmentId)
      } catch (apiError: any) {
        console.error("❌ [SEND-LINK] API client error:", apiError)
        if (apiError.status === 404) {
          return NextResponse.json({ error: "Appointment not found" }, { status: 404 })
        }
        throw apiError
      }
    } else {
      // Direct DB access for admin microservice only
      throwIfDirectDbNotAllowed("send-link - appointment fetch")
      const appointments = await query(
        `
        SELECT 
          a.appointment_id,
          a.assigned_to_user_id,
          a.assigned_to_name,
          a.title,
          a.start_datetime,
          h.HomeName as home_name
        FROM appointments a
        LEFT JOIN SyncActiveHomes h ON a.home_xref = h.Xref
        WHERE a.appointment_id = @param0 AND a.is_deleted = 0
      `,
        [appointmentId],
      )

      if (appointments.length === 0) {
        return NextResponse.json({ error: "Appointment not found" }, { status: 404 })
      }

      appointment = appointments[0]
    }

    if (!appointment) {
      return NextResponse.json({ error: "Appointment not found" }, { status: 404 })
    }

    // Determine recipient - prioritize logged-in user first, then override, then assigned staff
    // This ensures the person sending the link gets it sent to themselves if they're assigned
    let recipientClerkUserId: string | null = null
    let recipientName: string | null = null
    let recipientPhone: string | null = recipientOverride?.phone || null
    
    // Priority 1: Logged-in user (if they're assigned to this appointment)
    if (auth.clerkUserId && appointment.assigned_to_user_id) {
      // Check if logged-in user matches assigned user (by clerk_user_id or GUID)
      let loggedInUserMatches = false
      
      // Direct match by clerk_user_id
      if (appointment.assigned_to_user_id === auth.clerkUserId) {
        loggedInUserMatches = true
      } else {
        // Check if assigned_to_user_id is a GUID that matches logged-in user's app_users.id
        try {
          if (useApiClient) {
            // Use API client to lookup user
            const userLookup = await radiusApiClient.lookupUser({
              clerkUserId: auth.clerkUserId,
              microserviceCode: 'home-visits'
            })
            loggedInUserMatches = userLookup.user?.id === appointment.assigned_to_user_id
          } else {
            // Direct DB for admin service
            const userCheck = await query(
              `SELECT id FROM app_users WHERE clerk_user_id = @param0 AND id = @param1`,
              [auth.clerkUserId, appointment.assigned_to_user_id]
            )
            loggedInUserMatches = userCheck.length > 0
          }
        } catch (checkError) {
          console.error(`❌ [SEND-LINK] Error checking user match:`, checkError)
        }
      }
      
      if (loggedInUserMatches) {
        recipientClerkUserId = auth.clerkUserId
        recipientName = auth.name || appointment.assigned_to_name
        console.log(`✅ [SEND-LINK] Prioritizing logged-in user: ${auth.clerkUserId}`)
      }
    }
    
    // Priority 2: Override from request body
    if (!recipientClerkUserId && recipientOverride?.clerkUserId) {
      recipientClerkUserId = recipientOverride.clerkUserId
      recipientName = recipientOverride.name || appointment.assigned_to_name
    }
    
    // Priority 3: Assigned staff member
    if (!recipientClerkUserId) {
      recipientClerkUserId = appointment.assigned_to_user_id
      recipientName = appointment.assigned_to_name
    }

    if (!recipientClerkUserId && !recipientPhone) {
      return NextResponse.json(
        { error: "No staff member assigned to this appointment" },
        { status: 400 },
      )
    }

    // If phone not provided in override, fetch from database via API client
    // Check both clerk_user_id and id (GUID) since staff list can return either
    if (!recipientPhone && recipientClerkUserId) {
      let staffUser: any = null

      if (useApiClient) {
        // Use API client to lookup user
        try {
          const userLookup = await radiusApiClient.lookupUser({
            clerkUserId: recipientClerkUserId,
            microserviceCode: 'home-visits'
          })
          
          if (userLookup.user) {
            staffUser = userLookup.user
          } else {
            // If not found by clerkUserId, check if it's a GUID
            // Note: API client doesn't support lookup by GUID directly
            // This case should be rare - typically assigned_to_user_id is clerk_user_id
            const isGuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(recipientClerkUserId)
            if (isGuid) {
              console.warn(`⚠️ [SEND-LINK] assigned_to_user_id is a GUID (${recipientClerkUserId}). API client doesn't support GUID lookup. This may be a case manager.`)
              // For GUIDs, we can't look up via API client - this would require a new API endpoint
              // For now, we'll return an error suggesting the user needs to be looked up differently
            }
          }
        } catch (apiError) {
          console.error("❌ [SEND-LINK] API client error fetching user:", apiError)
        }
      } else {
        // Direct DB access for admin microservice only
        throwIfDirectDbNotAllowed("send-link - user lookup")
        // First try by clerk_user_id (most common case)
        let staffUsers = await query(
          `
          SELECT 
            u.id,
            u.clerk_user_id,
            u.phone,
            u.first_name,
            u.last_name,
            u.email
          FROM app_users u
          WHERE u.clerk_user_id = @param0 AND u.is_active = 1
        `,
          [recipientClerkUserId],
        )

        // If not found, try by id (GUID) - in case staff list returned GUID instead of clerk_user_id
        if (staffUsers.length === 0) {
          // Check if it looks like a GUID
          const isGuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(recipientClerkUserId)
          if (isGuid) {
            staffUsers = await query(
              `
              SELECT 
                u.id,
                u.clerk_user_id,
                u.phone,
                u.first_name,
                u.last_name,
                u.email
              FROM app_users u
              WHERE u.id = @param0 AND u.is_active = 1
            `,
              [recipientClerkUserId],
            )
          }
        }

        if (staffUsers.length > 0) {
          staffUser = staffUsers[0]
        }
      }

      // NO CLERK API CALLS - user must exist in database
      // If user not found, return error (do not sync from Clerk)
      if (!staffUser) {
        // Staff member not found - return error with details for UI to handle
        // This could be a case manager (not in app_users) or user doesn't exist
        return NextResponse.json(
          {
            error: "Staff member not found in system",
            message: `${recipientName || "This staff member"} is not in the app_users table. They may be a case manager or need to be added to the system.`,
            recipientName: recipientName,
            recipientClerkUserId: recipientClerkUserId,
          },
          { status: 404 },
        )
      }

      recipientPhone = staffUser.phone || null
      recipientName = recipientName || `${staffUser.first_name || ''} ${staffUser.last_name || ''}`.trim() || staffUser.name || recipientName
    }

    if (!recipientPhone || recipientPhone.trim() === "") {
      return NextResponse.json(
        {
          error: "Phone number not found",
          message: `No phone number on file for ${recipientName}. Please add a phone number to their profile.`,
          recipientName: recipientName,
          recipientClerkUserId: recipientClerkUserId,
        },
        { status: 400 },
      )
    }

    // Validate Twilio configuration
    const accountSid = process.env.TWILIO_ACCOUNT_SID
    const authToken = process.env.TWILIO_AUTH_TOKEN
    const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID

    if (!accountSid || !authToken) {
      return NextResponse.json(
        {
          error: "Twilio credentials not configured. Please contact system administrator.",
        },
        { status: 500 },
      )
    }

    if (!messagingServiceSid) {
      return NextResponse.json(
        {
          error: "Twilio messaging service not configured. Please contact system administrator.",
        },
        { status: 500 },
      )
    }

    // Generate mobile appointment link
    // Priority: 1) Environment variable, 2) Origin header, 3) Host header, 4) Production fallback
    let baseUrl = process.env.NEXT_PUBLIC_APP_URL
    
    if (!baseUrl) {
      const origin = request.headers.get("origin")
      if (origin) {
        baseUrl = origin
      } else {
        const host = request.headers.get("host")
        if (host) {
          // Determine protocol based on host (Vercel previews use https)
          const protocol = host.includes("vercel.app") || host.includes("refugehouse.app") ? "https" : "http"
          baseUrl = `${protocol}://${host}`
        } else {
          // Production fallback
          baseUrl = "https://visit.refugehouse.app"
        }
      }
    }
    
    const mobileLink = `${baseUrl}/mobile/appointment/${appointmentId}`

    // Format appointment date/time
    const appointmentDate = appointment.start_datetime
      ? new Date(appointment.start_datetime).toLocaleDateString("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
        })
      : "your appointment"

    // Create SMS message
    const messageText = `Refuge House: Appointment link for ${appointment.home_name || appointment.title} on ${appointmentDate}. Open: ${mobileLink}`

    // Log communication (non-blocking for visit service)
    let microserviceId: string | null = null
    try {
      microserviceId = await getMicroserviceId()
    } catch (microserviceError) {
      console.warn("⚠️ [SEND-LINK] Failed to get microservice ID (non-blocking):", microserviceError)
      // Continue without microservice ID
    }
    
    try {
      logId = await logCommunication({
        source_application: "home-visit-app",
        source_feature: "appointment-link-sms",
        source_reference_id: appointmentId,
        sent_by_user_id: auth.clerkUserId || undefined,
        sent_by_user_name: auth.name || "System",
        sent_by_user_email: auth.email || undefined,
        communication_type: "notification",
        delivery_method: "sms",
        recipient_phone: recipientPhone,
        recipient_name: recipientName,
        message_text: messageText,
        status: "pending",
      })
    } catch (logError) {
      console.error("Failed to log communication:", logError)
      // Continue with SMS sending even if logging fails
    }

    // Send SMS via Twilio
    const client = require("twilio")(accountSid, authToken)

    const twilioMessage = await client.messages.create({
      body: messageText,
      messagingServiceSid: messagingServiceSid,
      to: recipientPhone!,
    })

    // Update communication log
    if (logId) {
      try {
        await updateCommunicationStatus(logId, "sent", undefined, twilioMessage.sid, "twilio")
      } catch (updateError) {
        console.error("Failed to update log status:", updateError)
      }
    }

    return NextResponse.json({
      success: true,
      message: `Appointment link sent to ${recipientName}`,
      phoneNumber: recipientPhone,
      recipientName: recipientName,
      sid: twilioMessage.sid,
    })
  } catch (error: any) {
    console.error("Error sending appointment link:", error)

    // Handle specific Twilio errors
    if (error.code) {
      let errorMessage = `Twilio Error ${error.code}: ${error.message}`

      switch (error.code) {
        case 21211:
          errorMessage = "Invalid phone number format"
          break
        case 21608:
          errorMessage = "Phone number is not verified (Twilio trial account restriction)"
          break
        case 21614:
          errorMessage = "Invalid phone number format or unsupported destination"
          break
        case 20003:
          errorMessage = "Twilio authentication failed"
          break
      }

      if (logId) {
        try {
          await updateCommunicationStatus(logId, "failed", errorMessage)
        } catch (updateError) {
          console.error("Failed to update log status:", updateError)
        }
      }

      return NextResponse.json({ error: errorMessage, code: error.code }, { status: 400 })
    }

    if (logId) {
      try {
        await updateCommunicationStatus(logId, "failed", error.message)
      } catch (updateError) {
        console.error("Failed to update log status:", updateError)
      }
    }

    return NextResponse.json(
      { error: "Failed to send SMS: " + error.message },
      { status: 500 },
    )
  }
}

