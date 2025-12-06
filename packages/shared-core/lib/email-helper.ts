/**
 * @shared-core
 * Email helper utilities for sending messages via SendGrid
 * Includes automatic communication logging
 */

import sgMail from "@sendgrid/mail"
import { logCommunication, updateCommunicationStatus, getMicroserviceId } from "./communication"

export interface EmailOptions {
  to: string | string[]
  subject: string
  text: string
  html?: string
  recipientName?: string
  cc?: string | string[]
  fromEmail?: string
  fromName?: string
  sourceApplication?: string
  sourceFeature?: string
  sourceReferenceId?: string
  sentByUserId?: string
  sentByUserName?: string
  sentByUserEmail?: string
  attachments?: Array<{
    content: string
    filename: string
    type?: string
    disposition?: string
  }>
}

export interface EmailResult {
  success: boolean
  messageId?: string
  error?: string
}

/**
 * Send email via SendGrid with automatic communication logging
 * @param options - Email options including recipient, subject, and content
 * @returns Email result with success status and message ID
 */
export async function sendEmail(options: EmailOptions): Promise<EmailResult> {
  const {
    to,
    subject,
    text,
    html,
    recipientName,
    cc,
    fromEmail = process.env.SENDGRID_FROM_EMAIL || "noreply@refugehouse.org",
    fromName = "Refuge House Platform",
    sourceApplication = "refugehouse-platform",
    sourceFeature,
    sourceReferenceId,
    sentByUserId,
    sentByUserName,
    sentByUserEmail,
    attachments,
  } = options

  // Validate SendGrid configuration
  const apiKey = process.env.SENDGRID_API_KEY

  if (!apiKey) {
    return {
      success: false,
      error: "SendGrid API key not configured. Please contact system administrator.",
    }
  }

  // Set SendGrid API key
  sgMail.setApiKey(apiKey)

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
      delivery_method: "email",
      recipient_email: Array.isArray(to) ? to.join(", ") : to,
      recipient_name: recipientName || (Array.isArray(to) ? to.join(", ") : to),
      subject: subject,
      message_text: text,
      message_html: html,
      sender_email: fromEmail,
      sender_name: fromName,
      status: "pending",
    })
  } catch (logError) {
    console.error("Failed to log communication:", logError)
    // Continue with email sending even if logging fails
  }

  try {
    // Prepare email message
    const msg: any = {
      to,
      from: {
        email: fromEmail,
        name: fromName,
      },
      subject,
      text,
      html: html || text,
    }

    // Add CC if specified
    if (cc) {
      msg.cc = cc
    }

    // Add attachments if specified
    if (attachments && attachments.length > 0) {
      msg.attachments = attachments
    }

    // Send email
    const response = await sgMail.send(msg)

    // Update communication log on success
    if (logId) {
      try {
        const messageId = response[0]?.headers["x-message-id"] || undefined
        await updateCommunicationStatus(logId, "sent", undefined, messageId, "sendgrid")
      } catch (updateError) {
        console.error("Failed to update log status:", updateError)
      }
    }

    return {
      success: true,
      messageId: response[0]?.headers["x-message-id"],
    }
  } catch (error: any) {
    const errorMessage = error.message || "Unknown error"

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
    }
  }
}

/**
 * Validate SendGrid configuration
 * @returns true if SendGrid is properly configured
 */
export function isSendGridConfigured(): boolean {
  return !!process.env.SENDGRID_API_KEY
}

