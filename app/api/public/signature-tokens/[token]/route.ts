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
    const tokenData = await query(
      `
      SELECT 
        st.token,
        st.visit_form_id,
        st.signer_name,
        st.signer_role,
        st.signer_type,
        st.phone_number,
        st.email_address,
        st.expires_at,
        st.is_used,
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
      token: tokenInfo.token,
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
    const tokenData = await query(
      `
      SELECT 
        st.token,
        st.visit_form_id,
        st.signer_name,
        st.signer_role,
        st.signer_type,
        st.expires_at,
        st.is_used,
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

    // Get existing visit form data
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

    if (visitForm.length === 0) {
      return NextResponse.json(
        { error: "Visit form not found" },
        { status: 404 }
      )
    }

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
    const finalSignerName = signerName || tokenInfo.signer_name || "Unknown"
    const now = new Date().toISOString()

    if (tokenInfo.signer_type === "foster_parent_1") {
      signatures.fosterParent1 = {
        name: finalSignerName,
        signature: signature,
        date: now,
      }
    } else if (tokenInfo.signer_type === "foster_parent_2") {
      signatures.fosterParent2 = {
        name: finalSignerName,
        signature: signature,
        date: now,
      }
    } else if (tokenInfo.signer_type === "staff") {
      signatures.staff = {
        name: finalSignerName,
        signature: signature,
        date: now,
        role: tokenInfo.signer_role || "Staff",
      }
    } else if (tokenInfo.signer_type === "supervisor") {
      signatures.supervisor = {
        name: finalSignerName,
        signature: signature,
        date: now,
      }
    } else {
      // Generic signature field
      signatures[tokenInfo.signer_type] = {
        name: finalSignerName,
        signature: signature,
        date: now,
      }
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

    // Mark token as used
    await query(
      `
      UPDATE signature_tokens
      SET 
        is_used = 1,
        used_at = GETUTCDATE(),
        updated_at = GETUTCDATE()
      WHERE token = @param0
      `,
      [token]
    )

    // Send email notification to test email (hardcoded for testing)
    try {
      const testEmail = "jduarte@refugehouse.org"
      const apiKey = process.env.SENDGRID_API_KEY
      const fromEmail = process.env.SENDGRID_FROM_EMAIL || "noreply@refugehouse.org"
      
      if (apiKey) {
        sgMail.setApiKey(apiKey)
        
        // Truncate signature if too large for email
        let signatureForEmail = signature
        if (signature.length > 50000) {
          signatureForEmail = signature.substring(0, 50000) + "... (truncated)"
        }

        const emailHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Test Signature Received</h2>
            <p><strong>Signer:</strong> ${finalSignerName}</p>
            <p><strong>Role:</strong> ${tokenInfo.signer_role || "N/A"}</p>
            <p><strong>Signed:</strong> ${new Date(now).toLocaleString()}</p>
            <p><strong>Token:</strong> ${token}</p>
            <p><strong>Description:</strong> ${tokenInfo.description || "N/A"}</p>
            <p><strong>Visit Form ID:</strong> ${tokenInfo.visit_form_id}</p>
            <hr>
            <h3>Signature Image:</h3>
            <img src="${signatureForEmail}" alt="Signature" style="max-width: 100%; border: 1px solid #ccc; padding: 10px;" />
          </div>
        `

        const emailText = `Test Signature Received\n\nSigner: ${finalSignerName}\nRole: ${tokenInfo.signer_role || "N/A"}\nSigned: ${new Date(now).toLocaleString()}\nToken: ${token}\nVisit Form ID: ${tokenInfo.visit_form_id}`

        const msg = {
          to: testEmail,
          from: {
            email: fromEmail,
            name: "Foster Home Visit System",
          },
          subject: "Test Signature Received",
          text: emailText,
          html: emailHtml,
        }

        await sgMail.send(msg)
        console.log("Test signature email sent to:", testEmail)
      } else {
        console.warn("SENDGRID_API_KEY not configured - skipping email notification")
      }
    } catch (emailError: any) {
      // Don't fail signature submission if email fails
      console.error("Failed to send test signature email:", emailError)
    }

    return NextResponse.json({
      success: true,
      message: "Signature submitted successfully",
      visitFormId: tokenInfo.visit_form_id,
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

