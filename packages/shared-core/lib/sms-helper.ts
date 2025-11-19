/**
 * @shared-core
 * SMS helper utilities for sending messages via Twilio
 * Includes automatic communication logging
 */

import { logCommunication, updateCommunicationStatus, getMicroserviceId } from "./communication"

export interface SMSOptions {
  to: string
  body: string
  recipientName?: string
  sourceApplication?: string
  sourceFeature?: string
  sourceReferenceId?: string
  sentByUserId?: string
  sentByUserName?: string
  sentByUserEmail?: string
}

export interface SMSResult {
  success: boolean
  sid?: string
  error?: string
  code?: number
}

/**
 * Send SMS via Twilio with automatic communication logging
 * @param options - SMS options including recipient and message
 * @returns SMS result with success status and message SID
 */
export async function sendSMS(options: SMSOptions): Promise<SMSResult> {
  const {
    to,
    body,
    recipientName,
    sourceApplication = "refugehouse-platform",
    sourceFeature,
    sourceReferenceId,
    sentByUserId,
    sentByUserName,
    sentByUserEmail,
  } = options

  // Validate Twilio configuration
  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken = process.env.TWILIO_AUTH_TOKEN
  const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID

  if (!accountSid || !authToken) {
    return {
      success: false,
      error: "Twilio credentials not configured. Please contact system administrator.",
    }
  }

  if (!messagingServiceSid) {
    return {
      success: false,
      error: "Twilio messaging service not configured. Please contact system administrator.",
    }
  }

  let logId: string | null = null

  // Log communication before sending
  try {
    const microserviceId = await getMicroserviceId()
    logId = await logCommunication({
      source_application: sourceApplication,
      source_feature: sourceFeature,
      source_reference_id: sourceReferenceId,
      sent_by_user_id: sentByUserId,
      sent_by_user_name: sentByUserName || "System",
      sent_by_user_email: sentByUserEmail,
      communication_type: "notification",
      delivery_method: "sms",
      recipient_phone: to,
      recipient_name: recipientName || to,
      message_text: body,
      status: "pending",
    })
  } catch (logError) {
    console.error("Failed to log communication:", logError)
    // Continue with SMS sending even if logging fails
  }

  try {
    // Initialize Twilio client
    const client = require("twilio")(accountSid, authToken)

    // Send SMS
    const twilioMessage = await client.messages.create({
      body,
      messagingServiceSid,
      to,
    })

    // Update communication log on success
    if (logId) {
      try {
        await updateCommunicationStatus(logId, "sent", undefined, twilioMessage.sid, "twilio")
      } catch (updateError) {
        console.error("Failed to update log status:", updateError)
      }
    }

    return {
      success: true,
      sid: twilioMessage.sid,
    }
  } catch (error: any) {
    // Handle Twilio errors
    let errorMessage = error.message || "Unknown error"
    let errorCode = error.code

    if (error.code) {
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
    }

    // Update communication log on failure
    if (logId) {
      try {
        await updateCommunicationStatus(logId, "failed", errorMessage)
      } catch (updateError) {
        console.error("Failed to update log status:", updateError)
      }
    }

    return {
      success: false,
      error: errorMessage,
      code: errorCode,
    }
  }
}

/**
 * Validate Twilio configuration
 * @returns true if Twilio is properly configured
 */
export function isTwilioConfigured(): boolean {
  return !!(
    process.env.TWILIO_ACCOUNT_SID &&
    process.env.TWILIO_AUTH_TOKEN &&
    process.env.TWILIO_MESSAGING_SERVICE_SID
  )
}

