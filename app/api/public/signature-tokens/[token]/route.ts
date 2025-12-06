import { NextResponse, type NextRequest } from "next/server"
import { query } from "@refugehouse/shared-core/db"
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
    // All columns now exist in schema
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
    // All columns now exist in schema
    // Need token_id for UPDATE statement
    // Also need signature_key to map to correct field, and created_by info for email notification
    const tokenData = await query(
      `
      SELECT 
        st.token_id,
        st.token,
        st.visit_form_id,
        st.signer_name,
        st.signer_role,
        st.signer_type,
        st.signature_key,
        st.expires_at,
        st.is_used,
        st.description,
        st.created_by_user_id,
        st.created_by_name
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

        // Update signatures based on signature_key (e.g., "parent1Signature", "staffSignature")
        // This is more reliable than signer_type since signature_key matches the form field names
        if (tokenInfo.signature_key) {
          // Use signature_key directly (e.g., "parent1Signature" -> signatures.parent1Signature)
          signatures[tokenInfo.signature_key] = signature
          
          // Also update the name field if it exists (e.g., "parent1" -> signatures.parent1)
          // Extract the base key (e.g., "parent1Signature" -> "parent1")
          const baseKey = tokenInfo.signature_key.replace(/Signature$/, "")
          if (baseKey !== tokenInfo.signature_key) {
            signatures[baseKey] = finalSignerName
          }
          
          // Update the date field (e.g., "parent1Date" -> signatures.parent1Date)
          const dateKey = baseKey + "Date"
          signatures[dateKey] = now.split('T')[0] // Just the date part (YYYY-MM-DD)
        } else {
          // Fallback to signer_type if signature_key is not available
          if (tokenInfo.signer_type === "foster_parent_1" || tokenInfo.signer_type === "parent1") {
            signatures.parent1Signature = signature
            signatures.parent1 = finalSignerName
            signatures.parent1Date = now.split('T')[0]
          } else if (tokenInfo.signer_type === "foster_parent_2" || tokenInfo.signer_type === "parent2") {
            signatures.parent2Signature = signature
            signatures.parent2 = finalSignerName
            signatures.parent2Date = now.split('T')[0]
          } else if (tokenInfo.signer_type === "staff") {
            signatures.staffSignature = signature
            signatures.staff = finalSignerName
            signatures.staffDate = now.split('T')[0]
          } else if (tokenInfo.signer_type === "supervisor") {
            signatures.supervisorSignature = signature
            signatures.supervisor = finalSignerName
            signatures.supervisorDate = now.split('T')[0]
          } else {
            // Generic signature field
            signatures[tokenInfo.signer_type] = signatureData
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
      }
    }
    
    // Store signature data in token record for reference (even if no visit form)
    // This allows the signature to be retrieved later regardless of document type

    // Mark token as used and store signature data
    // Match the working version: store signature_data, signer_name, signed_date
    // Convert date to proper format for SQL Server DATE type (YYYY-MM-DD)
    let formattedDate: string | null = null
    try {
      const dateObj = new Date(now)
      if (!isNaN(dateObj.getTime())) {
        formattedDate = dateObj.toISOString().split('T')[0] // Get YYYY-MM-DD part
      }
    } catch (dateError) {
      // If date parsing fails, use null
      formattedDate = null
    }

    // Ensure signature is a string or null
    const signatureValue = signature ? String(signature) : null
    const signerNameValue = finalSignerName ? String(finalSignerName) : null

    // Store signature data in description for standalone signatures (if no visit form)
    const signatureMetadata = JSON.stringify({
      signature: signatureData,
      submittedAt: now,
    })
    
    // For standalone signatures (no visit form), store in description
    // For visit form signatures, just mark as used
    const updateDescription = tokenInfo.visit_form_id 
      ? tokenInfo.description || "Signature submitted"
      : signatureMetadata
    
    // Update token - match working version structure
    // Wrap in try-catch for detailed error logging
    try {
      await query(
        `
        UPDATE signature_tokens
        SET 
          is_used = 1,
          used_at = GETUTCDATE(),
          updated_at = GETUTCDATE(),
          signature_data = @param1,
          signer_name = @param2,
          signed_date = @param3,
          description = @param4
        WHERE token_id = @param0
        `,
        [tokenInfo.token_id, signatureValue, signerNameValue, formattedDate, updateDescription]
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

    // Send email notification to the requester (person who requested the signature)
    // Also send to test email for testing purposes
    // Send email asynchronously without blocking signature submission
    (async () => {
      try {
        const apiKey = process.env.SENDGRID_API_KEY
        const fromEmail = process.env.SENDGRID_FROM_EMAIL || "noreply@refugehouse.org"
        const testEmail = "jduarte@refugehouse.org"

        console.log("📧 [SIGNATURE] Starting email notification process")
        console.log("📧 [SIGNATURE] From email:", fromEmail)
        console.log("📧 [SIGNATURE] API key configured:", !!apiKey)

        if (!apiKey) {
          console.warn("⚠️ [SIGNATURE] SendGrid API key not configured, skipping email")
          return
        }

        sgMail.setApiKey(apiKey)

        // Look up requester's email address
        let requesterEmail: string | null = null
        if (tokenInfo.created_by_user_id) {
          try {
            // Try to find user by clerk_user_id first (most common case)
            const userByClerkId = await query(
              `SELECT email FROM app_users WHERE clerk_user_id = @param0 AND is_active = 1`,
              [tokenInfo.created_by_user_id]
            )
            
            if (userByClerkId.length > 0) {
              requesterEmail = userByClerkId[0].email
            } else {
              // Try to find by app_user id (if created_by_user_id is an app_user id)
              const userById = await query(
                `SELECT email FROM app_users WHERE id = @param0 AND is_active = 1`,
                [tokenInfo.created_by_user_id]
              )
              
              if (userById.length > 0) {
                requesterEmail = userById[0].email
              }
            }
            
            console.log("📧 [SIGNATURE] Requester email lookup:", {
              created_by_user_id: tokenInfo.created_by_user_id,
              found: !!requesterEmail,
              email: requesterEmail || "not found"
            })
          } catch (emailLookupError) {
            console.error("❌ [SIGNATURE] Error looking up requester email:", emailLookupError)
            // Continue with test email only if lookup fails
          }
        }

        // Prepare email recipients
        const emailRecipients: string[] = []
        if (requesterEmail) {
          emailRecipients.push(requesterEmail)
        }
        // Always include test email for testing
        if (testEmail && !emailRecipients.includes(testEmail)) {
          emailRecipients.push(testEmail)
        }

        if (emailRecipients.length === 0) {
          console.warn("⚠️ [SIGNATURE] No email recipients found, skipping email")
          return
        }

        console.log("📧 [SIGNATURE] Sending to recipients:", emailRecipients)

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

        const subject = "Signature Received - " + safeSignerName
        const isTestSignature = !tokenInfo.visit_form_id
        const emailTitle = isTestSignature ? "Test Signature Received" : "Signature Confirmation"
        const emailIntro = isTestSignature 
          ? "A test signature has been submitted through the signature link system."
          : "A signature has been successfully submitted for the home visit form."
        
        // Build HTML content using string concatenation to avoid template literal issues with large base64 strings
        const htmlContent = 
          '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">' +
          '<h2 style="color: #5E3989;">' + emailTitle + '</h2>' +
          '<p>' + emailIntro + '</p>' +
          '<div style="margin: 20px 0;">' +
          '<p><strong>Signer Name:</strong> ' + safeSignerName + '</p>' +
          '<p><strong>Role:</strong> ' + safeRole + '</p>' +
          '<p><strong>Signed Date:</strong> ' + safeSignedDate + '</p>' +
          (tokenInfo.visit_form_id ? '<p><strong>Visit Form ID:</strong> ' + String(tokenInfo.visit_form_id) + '</p>' : '<p><strong>Type:</strong> Standalone Test Signature</p>') +
          '</div>' +
          '<div style="margin: 30px 0; padding: 20px; background-color: #f5f5f5; border: 1px solid #ddd; border-radius: 4px;">' +
          '<h3 style="margin-top: 0;">Signature Image:</h3>' +
          '<img src="' + safeSignature + '" alt="Signature" style="max-width: 100%; height: auto; border: 1px solid #ccc; background-color: white; padding: 10px;" />' +
          '</div>' +
          (!isTestSignature ? '<p style="color: #666; font-size: 12px; margin-top: 30px;">' +
          'The signature has been automatically added to the visit form.' +
          '</p>' : '<p style="color: #666; font-size: 12px; margin-top: 30px;">' +
          'This is a test signature from the signature link testing system.' +
          '</p>') +
          '</div>'

        const textContent = 
          emailTitle + "\n\n" +
          emailIntro + "\n\n" +
          "Signer Name: " + safeSignerName + "\n" +
          "Role: " + safeRole + "\n" +
          "Signed Date: " + safeSignedDate + "\n" +
          (tokenInfo.visit_form_id ? "Visit Form ID: " + String(tokenInfo.visit_form_id) + "\n" : "Type: Standalone Test Signature\n") +
          "\nSignature Image: (see HTML version)\n\n" +
          (!isTestSignature ? "The signature has been automatically added to the visit form.\n" : "This is a test signature from the signature link testing system.\n")

        console.log("📧 [SIGNATURE] Attempting to send email to:", emailRecipients)
        console.log("📧 [SIGNATURE] Subject:", subject)
        console.log("📧 [SIGNATURE] HTML content length:", htmlContent.length)
        console.log("📧 [SIGNATURE] Text content length:", textContent.length)

        // Send to all recipients
        const emailResult = await sgMail.send({
          to: emailRecipients,
          from: {
            email: fromEmail,
            name: "Foster Home Visit System",
          },
          subject: subject,
          text: textContent,
          html: htmlContent,
        })

        console.log("✅ [SIGNATURE] Email sent successfully to:", emailRecipients)
        console.log("✅ [SIGNATURE] SendGrid response status:", emailResult[0]?.statusCode)
        console.log("✅ [SIGNATURE] SendGrid response headers:", JSON.stringify(emailResult[0]?.headers || {}))
      } catch (emailError: any) {
        console.error("❌ [SIGNATURE] Failed to send signature confirmation email:", emailError)
        console.error("❌ [SIGNATURE] Email error details:", {
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

