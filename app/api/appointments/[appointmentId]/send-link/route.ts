import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { logCommunication, updateCommunicationStatus, getMicroserviceId } from "@/lib/communication-logging"
import { getClerkUserIdFromRequest } from "@/lib/clerk-auth-helper"

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

    // Get appointment details
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

    const appointment = appointments[0]

    // Determine recipient - use override if provided, otherwise use assigned staff
    let recipientClerkUserId = recipientOverride?.clerkUserId || appointment.assigned_to_user_id
    let recipientName = recipientOverride?.name || appointment.assigned_to_name
    let recipientPhone: string | null = recipientOverride?.phone || null

    if (!recipientClerkUserId && !recipientPhone) {
      return NextResponse.json(
        { error: "No staff member assigned to this appointment" },
        { status: 400 },
      )
    }

    // If phone not provided in override, fetch from database
    // Check both clerk_user_id and id (GUID) since staff list can return either
    if (!recipientPhone && recipientClerkUserId) {
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

      // If still not found and it's a Clerk user ID (starts with 'user_'), try to sync from Clerk
      if (staffUsers.length === 0 && recipientClerkUserId.startsWith('user_')) {
        try {
          const { clerkClient } = await import("@clerk/nextjs/server")
          const clerkUser = await clerkClient.users.getUser(recipientClerkUserId)
          if (clerkUser) {
            // Sync user from Clerk to app_users
            const { createOrUpdateAppUser } = await import("@/lib/user-management")
            const syncedUser = await createOrUpdateAppUser(clerkUser)
            
            // Now query again
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
              WHERE u.clerk_user_id = @param0 AND u.is_active = 1
            `,
              [recipientClerkUserId],
            )
            
            console.log(`✅ [SEND-LINK] Synced user ${recipientClerkUserId} from Clerk to app_users`)
          }
        } catch (syncError) {
          console.error(`❌ [SEND-LINK] Error syncing user from Clerk:`, syncError)
          // Continue to error handling below
        }
      }

      if (staffUsers.length === 0) {
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

      const staffUser = staffUsers[0]
      recipientPhone = staffUser.phone || null
      recipientName = recipientName || `${staffUser.first_name} ${staffUser.last_name}`.trim()
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

    // Log communication
    const microserviceId = await getMicroserviceId()
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

