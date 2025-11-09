import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import sgMail from "@sendgrid/mail"

export const dynamic = "force-dynamic"

// GET - Fetch token data
export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const token = params.token

    const tokens = await query(
      `SELECT 
        token_id, visit_form_id, appointment_id, signature_type, signature_key,
        recipient_email, recipient_name, expires_at, used_at, created_at,
        description
      FROM dbo.signature_tokens
      WHERE token = @param0 AND is_deleted = 0`,
      [token]
    )

    if (tokens.length === 0) {
      return NextResponse.json(
        { success: false, error: "Invalid signature link" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      token: tokens[0],
    })
  } catch (error: any) {
    console.error("Error fetching token:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch token",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}

// POST - Submit signature
export async function POST(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const token = params.token
    const body = await request.json()
    const { signature, signerName, signedDate } = body

    if (!signature || !signerName || !signedDate) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: signature, signerName, signedDate" },
        { status: 400 }
      )
    }

    // Fetch token
    const tokens = await query(
      `SELECT token_id, visit_form_id, signature_key, signature_type, expires_at, used_at
      FROM dbo.signature_tokens
      WHERE token = @param0 AND is_deleted = 0`,
      [token]
    )

    if (tokens.length === 0) {
      return NextResponse.json(
        { success: false, error: "Invalid signature link" },
        { status: 404 }
      )
    }

    const tokenData = tokens[0]

    // Check if already used
    if (tokenData.used_at) {
      return NextResponse.json(
        { success: false, error: "This signature link has already been used" },
        { status: 400 }
      )
    }

    // Check if expired
    const expiresAt = new Date(tokenData.expires_at)
    if (expiresAt < new Date()) {
      return NextResponse.json(
        { success: false, error: "This signature link has expired" },
        { status: 400 }
      )
    }

    // Check if this is a test token (signature_type = 'test')
    const isTestToken = tokenData.signature_type === 'test'

    if (!isTestToken) {
      // For real visit forms, update the form
      const forms = await query(
        "SELECT signatures FROM dbo.visit_forms WHERE visit_form_id = @param0 AND is_deleted = 0",
        [tokenData.visit_form_id]
      )

      if (forms.length === 0) {
        return NextResponse.json(
          { success: false, error: "Visit form not found" },
          { status: 404 }
        )
      }

      // Parse existing signatures
      let signatures = {}
      try {
        signatures = forms[0].signatures ? JSON.parse(forms[0].signatures) : {}
      } catch (e) {
        console.warn("Failed to parse existing signatures:", e)
      }

      // Update signatures with new signature
      const signatureKey = tokenData.signature_key
      const nameKey = signatureKey.replace("Signature", "")
      const dateKey = signatureKey.replace("Signature", "Date")

      signatures[signatureKey] = signature
      signatures[nameKey] = signerName
      signatures[dateKey] = signedDate

      // Update visit form with new signature
      await query(
        `UPDATE dbo.visit_forms 
        SET signatures = @param1, updated_at = GETUTCDATE()
        WHERE visit_form_id = @param0 AND is_deleted = 0`,
        [tokenData.visit_form_id, JSON.stringify(signatures)]
      )
    } else {
      // For test tokens, send email with signature image
      console.log(`✅ [TEST] Test signature submitted for token ${token}`)
      
      try {
        const apiKey = process.env.SENDGRID_API_KEY
        const fromEmail = process.env.SENDGRID_FROM_EMAIL || "noreply@refugehouse.org"
        const testEmail = process.env.TEST_SIGNATURE_EMAIL || fromEmail

        if (apiKey) {
          sgMail.setApiKey(apiKey)

          const subject = `Test Signature Received - ${signerName}`
          const htmlContent = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #5E3989;">Test Signature Received</h2>
              <p>A test signature has been submitted through the signature link system.</p>
              <div style="margin: 20px 0;">
                <p><strong>Signer Name:</strong> ${signerName}</p>
                <p><strong>Signed Date:</strong> ${signedDate}</p>
                <p><strong>Token:</strong> ${token}</p>
              </div>
              <div style="margin: 30px 0; padding: 20px; background-color: #f5f5f5; border: 1px solid #ddd; border-radius: 4px;">
                <h3 style="margin-top: 0;">Signature Image:</h3>
                <img src="${signature}" alt="Signature" style="max-width: 100%; height: auto; border: 1px solid #ccc; background-color: white; padding: 10px;" />
              </div>
              <p style="color: #666; font-size: 12px; margin-top: 30px;">
                This is a test signature from the signature link testing system.
              </p>
            </div>
          `

          const textContent = `
Test Signature Received

A test signature has been submitted through the signature link system.

Signer Name: ${signerName}
Signed Date: ${signedDate}
Token: ${token}

Signature Image: ${signature}

This is a test signature from the signature link testing system.
          `

          await sgMail.send({
            to: testEmail,
            from: {
              email: fromEmail,
              name: "Foster Home Visit System - Test",
            },
            subject: subject,
            text: textContent,
            html: htmlContent,
          })

          console.log(`📧 [TEST] Email sent to ${testEmail} with signature image`)
        } else {
          console.warn("⚠️ [TEST] SendGrid API key not configured, skipping email")
        }
      } catch (emailError) {
        console.error("❌ [TEST] Failed to send test signature email:", emailError)
        // Don't fail the signature submission if email fails
      }
    }

    // Mark token as used
    await query(
      `UPDATE dbo.signature_tokens
      SET used_at = GETUTCDATE(), signature_data = @param1, signer_name = @param2, signed_date = @param3
      WHERE token_id = @param0`,
      [tokenData.token_id, signature, signerName, signedDate]
    )

    return NextResponse.json({
      success: true,
      message: "Signature submitted successfully",
    })
  } catch (error: any) {
    console.error("Error submitting signature:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to submit signature",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}

