import { type NextRequest, NextResponse } from "next/server"
import { logCommunication, updateCommunicationStatus, getMicroserviceId } from "@/lib/communication-logging"

interface SMSResult {
  to: string
  success: boolean
  sid?: string
  error?: string
}

export async function POST(request: NextRequest) {
  try {
    const { phoneNumbers, message } = await request.json()

    // Validate required fields
    if (!phoneNumbers || !Array.isArray(phoneNumbers) || phoneNumbers.length === 0) {
      return NextResponse.json({ error: "Phone numbers array is required and cannot be empty" }, { status: 400 })
    }

    if (!message || message.trim().length === 0) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 })
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

    const microserviceId = await getMicroserviceId()

    // Initialize Twilio client
    const client = require("twilio")(accountSid, authToken)

    // Process each phone number
    const results: SMSResult[] = []
    const cleanedNumbers = phoneNumbers.map((num: string) => num.trim()).filter((num: string) => num.length > 0)

    for (const phoneNumber of cleanedNumbers) {
      let logId: string | null = null
      try {
        logId = await logCommunication({
          microservice_id: microserviceId,
          communication_type: "bulk_sms",
          delivery_method: "sms",
          recipient_phone: phoneNumber,
          message_text: `[ADMIN] ${message}`,
          sender_name: "Admin Bulk SMS",
          status: "pending",
        })
      } catch (logError) {
        console.error(`Failed to log communication for ${phoneNumber}:`, logError)
        // Continue with SMS sending even if logging fails
      }

      try {
        // Create message for each phone number
        const twilioMessage = await client.messages.create({
          body: `[ADMIN] ${message}`, // Prefix with admin indicator
          messagingServiceSid: messagingServiceSid,
          to: phoneNumber,
        })

        if (logId) {
          try {
            await updateCommunicationStatus(logId, "sent", undefined, twilioMessage.sid, "twilio")
          } catch (updateError) {
            console.error(`Failed to update log status for ${phoneNumber}:`, updateError)
          }
        }

        results.push({
          to: phoneNumber,
          success: true,
          sid: twilioMessage.sid,
        })
      } catch (error: any) {
        console.error(`SMS Error for ${phoneNumber}:`, error)

        let errorMessage = "Unknown error"
        if (error.code) {
          switch (error.code) {
            case 21211:
              errorMessage = "Invalid phone number format"
              break
            case 21608:
              errorMessage = "Phone number not verified (trial account)"
              break
            case 21614:
              errorMessage = "Invalid phone number format or unsupported destination"
              break
            case 21606:
              errorMessage = "Not a valid mobile number"
              break
            case 21610:
              errorMessage = "Cannot send to landline number"
              break
            default:
              errorMessage = error.message || "SMS delivery failed"
          }
        }

        if (logId) {
          try {
            await updateCommunicationStatus(logId, "failed", errorMessage)
          } catch (updateError) {
            console.error(`Failed to update log status for ${phoneNumber}:`, updateError)
          }
        }

        results.push({
          to: phoneNumber,
          success: false,
          error: errorMessage,
        })
      }
    }

    const successCount = results.filter((r) => r.success).length
    const failureCount = results.filter((r) => !r.success).length

    return NextResponse.json({
      success: true,
      totalSent: successCount,
      totalFailed: failureCount,
      totalProcessed: results.length,
      results: results,
    })
  } catch (error: any) {
    console.error("Bulk SMS Error:", error)
    return NextResponse.json({ error: "Failed to process bulk SMS: " + error.message }, { status: 500 })
  }
}
