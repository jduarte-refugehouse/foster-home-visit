import { type NextRequest, NextResponse } from "next/server"
import { logCommunication, updateCommunicationStatus, getMicroserviceId } from "@/lib/communication-logging"

export async function POST(request: NextRequest) {
  let logId: string | null = null

  try {
    const { to, body } = await request.json()

    // Validate required fields
    if (!to || !body) {
      return NextResponse.json({ error: "Missing required fields: to, body" }, { status: 400 })
    }

    // Validate environment variables
    const accountSid = process.env.TWILIO_ACCOUNT_SID
    const authToken = process.env.TWILIO_AUTH_TOKEN
    const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID

    if (!accountSid || !authToken) {
      return NextResponse.json(
        {
          error:
            "Twilio credentials not configured. Please set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN environment variables.",
        },
        { status: 500 },
      )
    }

    if (!messagingServiceSid) {
      return NextResponse.json(
        {
          error: "Messaging Service SID not configured. Please set TWILIO_MESSAGING_SERVICE_SID environment variable.",
        },
        { status: 500 },
      )
    }

    try {
      const microserviceId = await getMicroserviceId()
      logId = await logCommunication({
        microservice_id: microserviceId,
        communication_type: "test",
        delivery_method: "sms",
        recipient_phone: to,
        message_text: `[DEV TEST] ${body}`,
        sender_name: "Development Test",
        status: "pending",
      })
    } catch (logError) {
      console.error("Failed to log communication:", logError)
      // Continue with SMS sending even if logging fails
    }

    // Initialize Twilio client exactly as Twilio shows
    const client = require("twilio")(accountSid, authToken)

    // Create message using Twilio's exact methodology
    const message = await client.messages.create({
      body: `[DEV TEST] ${body}`, // Prefix with dev indicator
      messagingServiceSid: messagingServiceSid,
      to: to,
    })

    if (logId) {
      try {
        await updateCommunicationStatus(logId, "sent", undefined, message.sid, "twilio")
      } catch (updateError) {
        console.error("Failed to update log status:", updateError)
      }
    }

    return NextResponse.json({
      success: true,
      sid: message.sid,
      status: message.status,
      to: message.to,
      from: message.from,
      body: message.body,
      dateCreated: message.dateCreated,
      messagingServiceSid: message.messagingServiceSid,
    })
  } catch (error: any) {
    console.error("Twilio SMS Error:", error)

    // Handle specific Twilio errors
    if (error.code) {
      let errorMessage = `Twilio Error ${error.code}: ${error.message}`

      // Provide helpful messages for common errors
      switch (error.code) {
        case 21211:
          errorMessage = "Invalid phone number format. Please include country code (e.g., +1234567890)"
          break
        case 21608:
          errorMessage = "Phone number is not verified. On trial accounts, you can only send to verified numbers."
          break
        case 21614:
          errorMessage = "Invalid phone number format or unsupported destination"
          break
        case 20003:
          errorMessage = "Authentication failed. Please check your Twilio credentials."
          break
        case 21606:
          errorMessage = "Phone number is not a valid mobile number"
          break
        case 21610:
          errorMessage = "Message cannot be sent to landline number"
          break
        case 30007:
          errorMessage = "Message delivery failed - carrier rejected the message"
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

    return NextResponse.json({ error: "Failed to send SMS: " + error.message }, { status: 500 })
  }
}
