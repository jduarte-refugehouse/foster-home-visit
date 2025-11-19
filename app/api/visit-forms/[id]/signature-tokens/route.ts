import { NextRequest, NextResponse } from "next/server"
import { query } from "@refugehouse/shared-core/db"
import { randomUUID } from "crypto"
import sgMail from "@sendgrid/mail"
import { logCommunication, getMicroserviceId } from "@refugehouse/shared-core/communication"

export const dynamic = "force-dynamic"

// POST - Generate and send signature token link
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const formId = params.id
    const body = await request.json()
    const {
      signatureType, // 'parent1', 'parent2', 'staff', etc.
      signatureKey, // 'parent1Signature', 'staffSignature', etc.
      recipientEmail,
      recipientName,
      recipientPhone, // Optional phone number for SMS
      description, // Optional description
      visitDate,
      familyName,
      createdByUserId,
      createdByName,
      sendViaSMS = false, // Whether to send via SMS instead of email
    } = body

    if (!signatureType || !signatureKey || !formId) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: signatureType, signatureKey, formId" },
        { status: 400 }
      )
    }

    // Must have either email or phone
    if (!recipientEmail && !recipientPhone) {
      return NextResponse.json(
        { success: false, error: "Must provide either recipientEmail or recipientPhone" },
        { status: 400 }
      )
    }

    // Generate secure token
    const token = randomUUID()
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7) // Token expires in 7 days

    // Get appointment_id from visit form
    const formData = await query(
      "SELECT appointment_id FROM dbo.visit_forms WHERE visit_form_id = @param0 AND is_deleted = 0",
      [formId]
    )

    if (formData.length === 0) {
      return NextResponse.json(
        { success: false, error: "Visit form not found" },
        { status: 404 }
      )
    }

    const appointmentId = formData[0].appointment_id

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
        formId,
        appointmentId,
        signatureType,
        signatureKey,
        token,
        recipientEmail || recipientPhone || "",
        recipientName || recipientEmail || recipientPhone || "",
        description || null,
        expiresAt,
        createdByUserId || "system",
        createdByName || "System",
      ]
    )

    // Generate signature link (ensure https:// protocol for clickable SMS links)
    let baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL || "https://foster-home-visit.vercel.app"
    // Ensure protocol is included
    if (!baseUrl.startsWith("http://") && !baseUrl.startsWith("https://")) {
      baseUrl = `https://${baseUrl}`
    }
    const signatureUrl = `${baseUrl}/signature/${token}`

    // Determine if sending via SMS or email
    const useSMS = sendViaSMS && recipientPhone

    if (useSMS) {
      // Send via SMS
      const accountSid = process.env.TWILIO_ACCOUNT_SID
      const authToken = process.env.TWILIO_AUTH_TOKEN
      const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID

      if (!accountSid || !authToken || !messagingServiceSid) {
        return NextResponse.json(
          { success: false, error: "Twilio credentials not configured" },
          { status: 500 }
        )
      }

      const client = require("twilio")(accountSid, authToken)
      const smsMessage = description
        ? `Refuge House: ${description}\n\nPlease sign: ${signatureUrl}`
        : `Refuge House: Signature request for ${familyName || "visit form"}${visitDate ? ` (${visitDate})` : ""}.\n\nPlease sign: ${signatureUrl}`

      const twilioMessage = await client.messages.create({
        body: smsMessage,
        messagingServiceSid: messagingServiceSid,
        to: recipientPhone,
      })

      // Log communication
      let logId: string | null = null
      try {
        const microserviceId = await getMicroserviceId()
        logId = await logCommunication({
          microservice_id: microserviceId,
          communication_type: "signature_request",
          delivery_method: "sms",
          recipient_phone: recipientPhone,
          recipient_name: recipientName,
          message_text: smsMessage,
          status: "pending",
          metadata: JSON.stringify({
            visit_form_id: formId,
            appointment_id: appointmentId,
            signature_type: signatureType,
            token: token,
          }),
        })
      } catch (logError) {
        console.error("Failed to log communication:", logError)
      }

      return NextResponse.json({
        success: true,
        token: token,
        signatureUrl: signatureUrl,
        sid: twilioMessage.sid,
        message: "Signature link sent via SMS successfully",
      })
    }

    // Send via email (default)
    const apiKey = process.env.SENDGRID_API_KEY
    const fromEmail = process.env.SENDGRID_FROM_EMAIL || "noreply@refugehouse.org"

    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: "SendGrid API key not configured" },
        { status: 500 }
      )
    }

    sgMail.setApiKey(apiKey)

    const subject = `Signature Request: Foster Home Visit - ${familyName || "Visit Form"}`
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #5E3989;">Signature Request</h2>
        <p>Hello ${recipientName || recipientEmail},</p>
        <p>You have been requested to sign a foster home visit form${visitDate ? ` for the visit on ${visitDate}` : ""}.</p>
        <p><strong>Family:</strong> ${familyName || "N/A"}</p>
        <p><strong>Signature Type:</strong> ${signatureType}</p>
        <p style="margin: 30px 0;">
          <a href="${signatureUrl}" 
             style="background-color: #5E3989; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
            Sign Document
          </a>
        </p>
        <p style="color: #666; font-size: 12px;">
          This link will expire in 7 days. If you did not expect this request, please ignore this email.
        </p>
        <p style="color: #666; font-size: 12px;">
          Or copy and paste this link into your browser:<br>
          ${signatureUrl}
        </p>
      </div>
    `

    const textContent = `
Signature Request

Hello ${recipientName || recipientEmail},

You have been requested to sign a foster home visit form${visitDate ? ` for the visit on ${visitDate}` : ""}.

Family: ${familyName || "N/A"}
Signature Type: ${signatureType}

Please click the following link to sign:
${signatureUrl}

This link will expire in 7 days. If you did not expect this request, please ignore this email.
    `

    // Log communication
    let logId: string | null = null
    try {
      const microserviceId = await getMicroserviceId()
      logId = await logCommunication({
        microservice_id: microserviceId,
        communication_type: "signature_request",
        delivery_method: "email",
        recipient_email: recipientEmail,
        recipient_name: recipientName || recipientEmail,
        subject: subject,
        message_text: textContent,
        message_html: htmlContent,
        sender_email: fromEmail,
        sender_name: "Foster Home Visit System",
        status: "pending",
        metadata: JSON.stringify({
          visit_form_id: formId,
          appointment_id: appointmentId,
          signature_type: signatureType,
          token: token,
        }),
      })
    } catch (logError) {
      console.error("Failed to log communication:", logError)
    }

    // Send email
    const msg = {
      to: recipientEmail,
      from: {
        email: fromEmail,
        name: "Foster Home Visit System",
      },
      subject: subject,
      text: textContent,
      html: htmlContent,
    }

    const response = await sgMail.send(msg)

    // Update log status
    if (logId) {
      try {
        // Note: updateCommunicationStatus would need to be imported if available
        // For now, we'll just log it
        console.log("Communication logged:", logId)
      } catch (updateError) {
        console.error("Failed to update log status:", updateError)
      }
    }

    return NextResponse.json({
      success: true,
      token: token,
      signatureUrl: signatureUrl,
      messageId: response[0].headers["x-message-id"],
      message: "Signature link sent successfully",
    })
  } catch (error: any) {
    console.error("Error generating signature token:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to generate signature token",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}

// GET - List signature tokens for a form
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const formId = params.id

    const tokens = await query(
      `SELECT 
        token_id, signature_type, signature_key, recipient_email, recipient_name,
        expires_at, used_at, signer_name, signed_date, created_at, created_by_name
      FROM dbo.signature_tokens
      WHERE visit_form_id = @param0 AND is_deleted = 0
      ORDER BY created_at DESC`,
      [formId]
    )

    return NextResponse.json({
      success: true,
      tokens: tokens,
    })
  } catch (error: any) {
    console.error("Error fetching signature tokens:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch signature tokens",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}

