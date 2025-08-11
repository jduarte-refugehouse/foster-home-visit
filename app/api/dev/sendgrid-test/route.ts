import { type NextRequest, NextResponse } from "next/server"
import sgMail from "@sendgrid/mail"

export async function POST(request: NextRequest) {
  try {
    const { to, subject, body } = await request.json()

    // Validate required fields
    if (!to || !subject || !body) {
      return NextResponse.json({ error: "Missing required fields: to, subject, body" }, { status: 400 })
    }

    // Validate environment variables
    const apiKey = process.env.SENDGRID_API_KEY
    const fromEmail = process.env.SENDGRID_FROM_EMAIL || "noreply@refugehouse.org"

    if (!apiKey) {
      return NextResponse.json(
        { error: "SendGrid API key not configured. Please set SENDGRID_API_KEY environment variable." },
        { status: 500 },
      )
    }

    // Set SendGrid API key
    sgMail.setApiKey(apiKey)

    // Prepare email content
    const msg = {
      to: to,
      from: {
        email: fromEmail,
        name: "Foster Home Visit System (DEV)",
      },
      subject: `[DEV TEST] ${subject}`, // Prefix with dev indicator
      text: `This is a development test email.\n\n${body}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h2 style="color: #dc3545; margin: 0;">🧪 Development Test Email</h2>
            <p style="margin: 10px 0 0 0; color: #6c757d;">This email was sent from the development environment.</p>
          </div>
          <div style="background-color: white; padding: 20px; border-radius: 8px; border: 1px solid #dee2e6;">
            <div style="white-space: pre-wrap; line-height: 1.6;">${body}</div>
          </div>
          <div style="margin-top: 20px; padding: 15px; background-color: #e9ecef; border-radius: 8px; font-size: 12px; color: #6c757d;">
            <p style="margin: 0;"><strong>Development Information:</strong></p>
            <p style="margin: 5px 0 0 0;">Sent via Foster Home Visit System - Development Environment</p>
          </div>
        </div>
      `,
    }

    // Send the email
    const response = await sgMail.send(msg)

    return NextResponse.json({
      success: true,
      messageId: response[0].headers["x-message-id"],
      to: to,
      subject: msg.subject,
      statusCode: response[0].statusCode,
    })
  } catch (error: any) {
    console.error("SendGrid Error:", error)

    // Handle SendGrid specific errors
    if (error.response) {
      const { message, code } = error.response.body.errors?.[0] || {}
      return NextResponse.json(
        {
          error: `SendGrid Error: ${message || error.message}`,
          code: code,
        },
        { status: error.code || 500 },
      )
    }

    return NextResponse.json({ error: "Failed to send email: " + error.message }, { status: 500 })
  }
}
