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
    let tokens
    try {
      tokens = await query(
        `SELECT token_id, visit_form_id, signature_key, signature_type, expires_at, used_at
        FROM dbo.signature_tokens
        WHERE token = @param0 AND is_deleted = 0`,
        [token]
      )
    } catch (queryError: any) {
      // Check if table doesn't exist
      if (queryError?.message?.includes("Invalid object name") || 
          queryError?.message?.includes("signature_tokens") ||
          queryError?.number === 208) {
        console.error("❌ [SIGNATURE] signature_tokens table does not exist")
        return NextResponse.json(
          {
            success: false,
            error: "Database table not found",
            details: "The signature_tokens table has not been created. Please run the create-signature-tokens-table.sql script.",
            errorCode: "TABLE_NOT_FOUND",
          },
          { status: 500 }
        )
      }
      throw queryError // Re-throw if it's a different error
    }

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
      let signatures: Record<string, any> = {}
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
      // For test tokens, send email with signature image (non-blocking)
      // Send email asynchronously without blocking signature submission
      (async () => {
        try {
          const apiKey = process.env.SENDGRID_API_KEY
          const fromEmail = process.env.SENDGRID_FROM_EMAIL || "noreply@refugehouse.org"
          const testEmail = process.env.TEST_SIGNATURE_EMAIL || fromEmail

          if (!apiKey) {
            console.warn("⚠️ [TEST] SendGrid API key not configured, skipping email")
            return
          }

          sgMail.setApiKey(apiKey)

          // Truncate signature if too long (base64 images can be very large)
          // Also escape any special characters that might break the template
          const signatureStr = String(signature || "")
          const signaturePreview = signatureStr.length > 50000 
            ? signatureStr.substring(0, 50000) + "... (truncated)" 
            : signatureStr
          
          // Escape HTML and ensure safe string interpolation
          const safeSignerName = String(signerName || "").replace(/"/g, "&quot;").replace(/'/g, "&#39;")
          const safeSignedDate = String(signedDate || "").replace(/"/g, "&quot;")
          const safeToken = String(token || "").replace(/"/g, "&quot;")
          // For base64 data URLs, we need to be careful - just use it directly but ensure it's a string
          const safeSignature = String(signaturePreview || "")

          const subject = "Test Signature Received - " + safeSignerName
          // Build HTML content using string concatenation to avoid template literal issues with large base64 strings
          const htmlContent = 
            '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">' +
            '<h2 style="color: #5E3989;">Test Signature Received</h2>' +
            '<p>A test signature has been submitted through the signature link system.</p>' +
            '<div style="margin: 20px 0;">' +
            '<p><strong>Signer Name:</strong> ' + safeSignerName + '</p>' +
            '<p><strong>Signed Date:</strong> ' + safeSignedDate + '</p>' +
            '<p><strong>Token:</strong> ' + safeToken + '</p>' +
            '</div>' +
            '<div style="margin: 30px 0; padding: 20px; background-color: #f5f5f5; border: 1px solid #ddd; border-radius: 4px;">' +
            '<h3 style="margin-top: 0;">Signature Image:</h3>' +
            '<img src="' + safeSignature + '" alt="Signature" style="max-width: 100%; height: auto; border: 1px solid #ccc; background-color: white; padding: 10px;" />' +
            '</div>' +
            '<p style="color: #666; font-size: 12px; margin-top: 30px;">' +
            'This is a test signature from the signature link testing system.' +
            '</p>' +
            '</div>'

          const textContent = 
            "Test Signature Received\n\n" +
            "A test signature has been submitted through the signature link system.\n\n" +
            "Signer Name: " + safeSignerName + "\n" +
            "Signed Date: " + safeSignedDate + "\n" +
            "Token: " + safeToken + "\n\n" +
            "Signature Image: (see HTML version)\n\n" +
            "This is a test signature from the signature link testing system."

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
        } catch (emailError: any) {
          console.error("❌ [TEST] Failed to send test signature email:", emailError)
          console.error("❌ [TEST] Email error details:", {
            message: emailError?.message,
            code: emailError?.code,
            response: emailError?.response?.body,
          })
          // Don't fail the signature submission if email fails
        }
      })()
    }

    // Mark token as used
    try {
      // Convert signedDate to proper format for SQL Server DATE type (YYYY-MM-DD)
      let formattedDate: string | null = null
      if (signedDate) {
        try {
          // Ensure it's in YYYY-MM-DD format
          const dateObj = new Date(signedDate)
          if (!isNaN(dateObj.getTime())) {
            formattedDate = dateObj.toISOString().split('T')[0] // Get YYYY-MM-DD part
          }
        } catch (dateError) {
          // If date parsing fails, use null
          formattedDate = null
        }
      }

      // Ensure signature is a string or null
      const signatureValue = signature ? String(signature) : null
      const signerNameValue = signerName ? String(signerName) : null

      await query(
        `UPDATE dbo.signature_tokens
        SET used_at = GETUTCDATE(), signature_data = @param1, signer_name = @param2, signed_date = @param3
        WHERE token_id = @param0`,
        [tokenData.token_id, signatureValue, signerNameValue, formattedDate]
      )
    } catch (dbError: any) {
      // Use try-catch around console.error to prevent errors from breaking error handling
      try {
        console.error("❌ [SIGNATURE] Database update failed:", dbError)
        console.error("❌ [SIGNATURE] DB Error details:", {
          message: dbError?.message,
          number: dbError?.number,
          state: dbError?.state,
          class: dbError?.class,
        })
      } catch (logError) {
        // If console.error fails, at least try to log to stderr directly
        process.stderr.write("Failed to log DB error: " + String(logError) + "\n")
      }
      throw dbError // Re-throw to be caught by outer catch
    }

    return NextResponse.json({
      success: true,
      message: "Signature submitted successfully",
    })
  } catch (error: any) {
    // Use try-catch around console.error to prevent errors from breaking error handling
    try {
      console.error("❌ [SIGNATURE] Error submitting signature:", error)
      if (error instanceof Error) {
        console.error("❌ [SIGNATURE] Error stack:", error.stack)
      }
      console.error("❌ [SIGNATURE] Error details:", {
        message: error?.message,
        code: error?.code,
        number: error?.number,
        state: error?.state,
        class: error?.class,
        originalError: error?.originalError,
      })
    } catch (logError) {
      // If console.error fails, at least try to log to stderr directly
      process.stderr.write("Failed to log error: " + String(logError) + "\n")
    }
    
    // Return more detailed error for debugging
    const errorResponse: any = {
      success: false,
      error: "Failed to submit signature",
      details: error instanceof Error ? error.message : String(error),
    }
    
    // Include SQL error details if available
    if (error?.number) {
      errorResponse.sqlError = {
        number: error.number,
        state: error.state,
        message: error.message,
      }
    }
    
    // Include the error type to help debug
    errorResponse.errorType = error?.constructor?.name || typeof error
    
    return NextResponse.json(errorResponse, { status: 500 })
  }
}

