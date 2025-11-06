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

    // Get appointment details
    const appointments = await query(
      `
      SELECT 
        a.appointment_id,
        a.assigned_to_user_id,
        a.assigned_to_name,
        a.title,
        a.home_name,
        a.start_datetime
      FROM appointments a
      WHERE a.appointment_id = @param0 AND a.is_deleted = 0
    `,
      [appointmentId],
    )

    if (appointments.length === 0) {
      return NextResponse.json({ error: "Appointment not found" }, { status: 404 })
    }

    const appointment = appointments[0]

    if (!appointment.assigned_to_user_id) {
      return NextResponse.json(
        { error: "No staff member assigned to this appointment" },
        { status: 400 },
      )
    }

    // Get staff member's phone number from app_users
    const staffUsers = await query(
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
      [appointment.assigned_to_user_id],
    )

    if (staffUsers.length === 0) {
      return NextResponse.json(
        { error: "Staff member not found in system" },
        { status: 404 },
      )
    }

    const staffUser = staffUsers[0]

    if (!staffUser.phone || staffUser.phone.trim() === "") {
      return NextResponse.json(
        {
          error: "Phone number not found",
          message: `No phone number on file for ${appointment.assigned_to_name}. Please add a phone number to their profile.`,
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
        sent_by_user_id: auth.clerkUserId,
        sent_by_user_name: auth.name || "System",
        sent_by_user_email: auth.email || null,
        communication_type: "notification",
        delivery_method: "sms",
        recipient_phone: staffUser.phone,
        recipient_name: appointment.assigned_to_name,
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
      to: staffUser.phone,
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
      message: `Appointment link sent to ${appointment.assigned_to_name}`,
      phoneNumber: staffUser.phone,
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

