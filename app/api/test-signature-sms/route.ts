import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { randomUUID } from "crypto"
import { logCommunication, getMicroserviceId } from "@/lib/communication-logging"

export const dynamic = "force-dynamic"

// POST - Generate signature token and send via SMS (for testing)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      phoneNumber,
      recipientName,
      description,
    } = body

    if (!phoneNumber || !recipientName) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: phoneNumber, recipientName" },
        { status: 400 }
      )
    }

    // Validate Twilio configuration
    const accountSid = process.env.TWILIO_ACCOUNT_SID
    const authToken = process.env.TWILIO_AUTH_TOKEN
    const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID

    if (!accountSid || !authToken) {
      return NextResponse.json(
        { success: false, error: "Twilio credentials not configured" },
        { status: 500 }
      )
    }

    if (!messagingServiceSid) {
      return NextResponse.json(
        { success: false, error: "Twilio Messaging Service SID not configured" },
        { status: 500 }
      )
    }

    // Generate secure token
    const token = randomUUID()
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7) // Token expires in 7 days

    // Create a test visit form ID (or use a dummy one for testing)
    // For testing, we'll create a minimal token entry without a real visit form
    const testFormId = randomUUID()
    const testAppointmentId = randomUUID()

    // Insert token into database
    await query(
      `INSERT INTO dbo.signature_tokens (
        visit_form_id, appointment_id, signature_type, signature_key, token,
        recipient_email, recipient_name, description, expires_at, created_by_user_id, created_by_name
      ) VALUES (
        @param0, @param1, @param2, @param3, @param4,
        @param5, @param6, @param7, @param8, @param9, @param10
      )`,
      [
        testFormId,
        testAppointmentId,
        "test",
        "testSignature",
        token,
        phoneNumber, // Store phone in email field for test
        recipientName,
        description || null,
        expiresAt,
        "test-user",
        "Test User",
      ]
    )

    // Generate signature link (ensure https:// protocol for clickable SMS links)
    let baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL || "https://foster-home-visit.vercel.app"
    // Ensure protocol is included
    if (!baseUrl.startsWith("http://") && !baseUrl.startsWith("https://")) {
      baseUrl = `https://${baseUrl}`
    }
    const signatureUrl = `${baseUrl}/signature/${token}`

    // Create SMS message
    const smsMessage = description
      ? `Refuge House: ${description}\n\nPlease sign: ${signatureUrl}`
      : `Refuge House: Signature request for ${recipientName}.\n\nPlease sign: ${signatureUrl}`

    // Log communication
    let logId: string | null = null
    try {
      const microserviceId = await getMicroserviceId()
      logId = await logCommunication({
        microservice_id: microserviceId,
        communication_type: "signature_request",
        delivery_method: "sms",
        recipient_phone: phoneNumber,
        recipient_name: recipientName,
        message_text: smsMessage,
        status: "pending",
        metadata: JSON.stringify({
          visit_form_id: testFormId,
          appointment_id: testAppointmentId,
          signature_type: "test",
          token: token,
        }),
      })
    } catch (logError) {
      console.error("Failed to log communication:", logError)
    }

    // Send SMS via Twilio
    const client = require("twilio")(accountSid, authToken)

    const twilioMessage = await client.messages.create({
      body: smsMessage,
      messagingServiceSid: messagingServiceSid,
      to: phoneNumber,
    })

    // Update log status
    if (logId) {
      try {
        // Note: updateCommunicationStatus would need to be imported if available
        console.log("Communication logged:", logId)
      } catch (updateError) {
        console.error("Failed to update log status:", updateError)
      }
    }

    return NextResponse.json({
      success: true,
      token: token,
      signatureUrl: signatureUrl,
      sid: twilioMessage.sid,
      message: "Signature link sent via SMS successfully",
    })
  } catch (error: any) {
    console.error("Error sending signature SMS:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to send signature SMS",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}

