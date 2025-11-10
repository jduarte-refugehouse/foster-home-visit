import { NextResponse, type NextRequest } from "next/server"
import { query } from "@/lib/db"
import sgMail from "@sendgrid/mail"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

/**
 * PUBLIC API ROUTE - No authentication required
 * Token-based signature collection for external users (foster parents, etc.)
 * Identity is verified via the token sent to a known phone number/email
 */

// GET - Validate token and retrieve signature request details
export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params

    if (!token) {
      return NextResponse.json(
        { error: "Token is required" },
        { status: 400 }
      )
    }

    // Look up token in database
    // Using actual schema columns: signer_role and phone_number exist, signer_type and email_address may not
    const tokenData = await query(
      `
      SELECT 
        st.token,
        st.visit_form_id,
        st.signer_name,
        st.signer_role,
        COALESCE(st.signer_type, st.signature_type) as signer_type,
        st.phone_number,
        COALESCE(st.email_address, st.recipient_email) as email_address,
        st.expires_at,
        COALESCE(st.is_used, CASE WHEN st.used_at IS NOT NULL THEN 1 ELSE 0 END) as is_used,
        st.used_at,
        st.description,
        vf.form_type,
        vf.visit_date
      FROM signature_tokens st
      LEFT JOIN visit_forms vf ON st.visit_form_id = vf.visit_form_id
      WHERE st.token = @param0
        AND st.is_deleted = 0
      `,
      [token]
    )

    if (tokenData.length === 0) {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 404 }
      )
    }

    const tokenInfo = tokenData[0]

    // Check if token is expired
    if (tokenInfo.expires_at && new Date(tokenInfo.expires_at) < new Date()) {
      return NextResponse.json(
        { error: "Token has expired" },
        { status: 410 }
      )
    }

    // Check if token is already used
    if (tokenInfo.is_used) {
      return NextResponse.json(
        {
          error: "This signature link has already been used",
          usedAt: tokenInfo.used_at,
        },
        { status: 410 }
      )
    }

    // Return token info (without sensitive data)
    return NextResponse.json({
      success: true,
      token: {
        token: tokenInfo.token,
        visit_form_id: tokenInfo.visit_form_id,
        signer_name: tokenInfo.signer_name,
        signer_role: tokenInfo.signer_role,
        signer_type: tokenInfo.signer_type,
        expires_at: tokenInfo.expires_at,
        is_used: tokenInfo.is_used,
        used_at: tokenInfo.used_at,
        description: tokenInfo.description,
        visit_date: tokenInfo.visit_date,
        form_type: tokenInfo.form_type,
      },
      signerName: tokenInfo.signer_name,
      signerRole: tokenInfo.signer_role,
      signerType: tokenInfo.signer_type,
      description: tokenInfo.description,
      visitDate: tokenInfo.visit_date,
      formType: tokenInfo.form_type,
    })
  } catch (error: any) {
    console.error("Error validating signature token:", error)
    return NextResponse.json(
      {
        error: "Failed to validate token",
        details: process.env.NODE_ENV === "development" ? error.message : undefined,
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
    const { token } = params
    const body = await request.json()
    const { signature, signerName } = body

    if (!token) {
      return NextResponse.json(
        { error: "Token is required" },
        { status: 400 }
      )
    }

    if (!signature) {
      return NextResponse.json(
        { error: "Signature is required" },
        { status: 400 }
      )
    }

    // Validate token
    // Using actual schema columns: signer_role exists, signer_type may not
    const tokenData = await query(
      `
      SELECT 
        st.token,
        st.visit_form_id,
        st.signer_name,
        st.signer_role,
        COALESCE(st.signer_type, st.signature_type) as signer_type,
        st.expires_at,
        COALESCE(st.is_used, CASE WHEN st.used_at IS NOT NULL THEN 1 ELSE 0 END) as is_used,
        st.description
      FROM signature_tokens st
      WHERE st.token = @param0
        AND st.is_deleted = 0
      `,
      [token]
    )

    if (tokenData.length === 0) {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 404 }
      )
    }

    const tokenInfo = tokenData[0]

    // Check if token is expired
    if (tokenInfo.expires_at && new Date(tokenInfo.expires_at) < new Date()) {
      return NextResponse.json(
        { error: "Token has expired" },
        { status: 410 }
      )
    }

    // Check if token is already used
    if (tokenInfo.is_used) {
      return NextResponse.json(
        { error: "This signature link has already been used" },
        { status: 410 }
      )
    }

    const finalSignerName = signerName || tokenInfo.signer_name || "Unknown"
    const now = new Date().toISOString()

    // Build signature data
    const signatureData = {
      name: finalSignerName,
      signature: signature,
      date: now,
      role: tokenInfo.signer_role || null,
      signerType: tokenInfo.signer_type,
    }

    // If visit_form_id exists, update the visit form
    if (tokenInfo.visit_form_id) {
      const visitForm = await query(
        `
        SELECT 
          visit_form_id,
          signatures,
          form_type,
          visit_date
        FROM visit_forms
        WHERE visit_form_id = @param0
          AND is_deleted = 0
        `,
        [tokenInfo.visit_form_id]
      )

      if (visitForm.length > 0) {
        const form = visitForm[0]

        // Parse existing signatures
        let signatures: any = {}
        if (form.signatures) {
          try {
            signatures = typeof form.signatures === "string" 
              ? JSON.parse(form.signatures) 
              : form.signatures
          } catch (e) {
            console.error("Error parsing signatures:", e)
            signatures = {}
          }
        }

        // Update signatures based on signer type
        if (tokenInfo.signer_type === "foster_parent_1") {
          signatures.fosterParent1 = signatureData
        } else if (tokenInfo.signer_type === "foster_parent_2") {
          signatures.fosterParent2 = signatureData
        } else if (tokenInfo.signer_type === "staff") {
          signatures.staff = signatureData
        } else if (tokenInfo.signer_type === "supervisor") {
          signatures.supervisor = signatureData
        } else {
          // Generic signature field
          signatures[tokenInfo.signer_type] = signatureData
        }

        // Update visit form with signature
        await query(
          `
          UPDATE visit_forms
          SET 
            signatures = @param1,
            updated_at = GETUTCDATE()
          WHERE visit_form_id = @param0
          `,
          [tokenInfo.visit_form_id, JSON.stringify(signatures)]
        )
      }
    }
    
    // Store signature data in token record for reference (even if no visit form)
    // This allows the signature to be retrieved later regardless of document type

    // Mark token as used and store signature data in description for standalone signatures
    const signatureMetadata = JSON.stringify({
      signature: signatureData,
      submittedAt: now,
    })
    
    // For standalone signatures (no visit form), store in description
    // For visit form signatures, just mark as used
    const updateDescription = tokenInfo.visit_form_id 
      ? tokenInfo.description || "Signature submitted"
      : signatureMetadata
    
    await query(
      `
      UPDATE signature_tokens
      SET 
        is_used = 1,
        used_at = GETUTCDATE(),
        updated_at = GETUTCDATE(),
        description = @param1
      WHERE token = @param0
      `,
      [token, updateDescription]
    )

    // Send email notification to test email (hardcoded for testing)
    // Send email asynchronously without blocking signature submission
    (async () => {
      try {
        const testEmail = "jduarte@refugehouse.org"
        const apiKey = process.env.SENDGRID_API_KEY
        const fromEmail = process.env.SENDGRID_FROM_EMAIL || "noreply@refugehouse.org"

        console.log("📧 [TEST] Starting email send process")
        console.log("📧 [TEST] From email:", fromEmail)
        console.log("📧 [TEST] To email:", testEmail)
        console.log("📧 [TEST] API key configured:", !!apiKey)

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
        const safeSignerName = String(finalSignerName || "").replace(/"/g, "&quot;").replace(/'/g, "&#39;")
        const safeSignedDate = String(new Date(now).toLocaleString() || "").replace(/"/g, "&quot;")
        const safeToken = String(token || "").replace(/"/g, "&quot;")
        const safeRole = String(tokenInfo.signer_role || "N/A").replace(/"/g, "&quot;")
        const safeDescription = String(tokenInfo.description || "N/A").replace(/"/g, "&quot;")
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
          '<p><strong>Role:</strong> ' + safeRole + '</p>' +
          '<p><strong>Signed Date:</strong> ' + safeSignedDate + '</p>' +
          '<p><strong>Token:</strong> ' + safeToken + '</p>' +
          '<p><strong>Description:</strong> ' + safeDescription + '</p>' +
          (tokenInfo.visit_form_id ? '<p><strong>Visit Form ID:</strong> ' + String(tokenInfo.visit_form_id) + '</p>' : '<p><strong>Type:</strong> Standalone Test Signature</p>') +
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
          "Role: " + safeRole + "\n" +
          "Signed Date: " + safeSignedDate + "\n" +
          "Token: " + safeToken + "\n" +
          "Description: " + safeDescription + "\n" +
          (tokenInfo.visit_form_id ? "Visit Form ID: " + String(tokenInfo.visit_form_id) + "\n" : "Type: Standalone Test Signature\n") +
          "\nSignature Image: (see HTML version)\n\n" +
          "This is a test signature from the signature link testing system."

        console.log("📧 [TEST] Attempting to send email to:", testEmail)
        console.log("📧 [TEST] Subject:", subject)
        console.log("📧 [TEST] HTML content length:", htmlContent.length)
        console.log("📧 [TEST] Text content length:", textContent.length)

        const emailResult = await sgMail.send({
          to: testEmail,
          from: {
            email: fromEmail,
            name: "Foster Home Visit System - Test",
          },
          subject: subject,
          text: textContent,
          html: htmlContent,
        })

        console.log("✅ [TEST] Email sent successfully to:", testEmail)
        console.log("✅ [TEST] SendGrid response status:", emailResult[0]?.statusCode)
        console.log("✅ [TEST] SendGrid response headers:", JSON.stringify(emailResult[0]?.headers || {}))
      } catch (emailError: any) {
        console.error("❌ [TEST] Failed to send test signature email:", emailError)
        console.error("❌ [TEST] Email error details:", {
          message: emailError?.message,
          code: emailError?.code,
          response: emailError?.response?.body,
          stack: emailError?.stack,
        })
        // Don't fail the signature submission if email fails
      }
    })()

    return NextResponse.json({
      success: true,
      message: "Signature submitted successfully",
      visitFormId: tokenInfo.visit_form_id || null,
      signatureData: signatureData,
    })
  } catch (error: any) {
    console.error("Error submitting signature:", error)
    return NextResponse.json(
      {
        error: "Failed to submit signature",
        details: process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    )
  }
}

