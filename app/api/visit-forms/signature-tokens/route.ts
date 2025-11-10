import { NextResponse, type NextRequest } from "next/server"
import { query } from "@/lib/db"
import { randomUUID } from "crypto"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

/**
 * Create signature tokens for visit forms
 * This is a protected route - requires authentication
 */

// POST - Create a new signature token
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      visitFormId,
      signerName,
      signerRole,
      signerType,
      phoneNumber,
      emailAddress,
      description,
      expiresInHours = 24,
    } = body

    // Validation
    if (!phoneNumber && !emailAddress) {
      return NextResponse.json(
        { error: "Either phoneNumber or emailAddress is required" },
        { status: 400 }
      )
    }

    if (!signerType) {
      return NextResponse.json(
        { error: "signerType is required" },
        { status: 400 }
      )
    }

    // Verify visit form exists (if provided)
    if (visitFormId) {
      const visitForm = await query(
        `
        SELECT visit_form_id, form_type, visit_date
        FROM visit_forms
        WHERE visit_form_id = @param0
          AND is_deleted = 0
        `,
        [visitFormId]
      )

      if (visitForm.length === 0) {
        return NextResponse.json(
          { error: "Visit form not found" },
          { status: 404 }
        )
      }
    }

    // Generate unique token
    const token = randomUUID().replace(/-/g, "").toLowerCase()

    // Calculate expiration
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + (expiresInHours || 24))

    // Insert token into database
    // All columns now exist in schema - populate all for consistency
    await query(
      `
      INSERT INTO signature_tokens (
        token,
        visit_form_id,
        appointment_id,
        signature_type,
        signature_key,
        recipient_email,
        recipient_name,
        signer_name,
        signer_role,
        phone_number,
        signer_type,
        email_address,
        description,
        expires_at,
        is_deleted,
        created_at,
        created_by_user_id,
        created_by_name,
        updated_at
      )
      VALUES (
        @param0, @param1, @param2, @param3, @param4, @param5, @param6, @param7, @param8, @param9, @param10, @param11, @param12, @param13, 0, GETUTCDATE(), 'system', 'System', GETUTCDATE()
      )
      `,
      [
        token,
        visitFormId || null, // visit_form_id - nullable in schema
        null, // appointment_id - nullable in schema
        signerType || 'test', // signature_type
        `${signerType || 'test'}Signature`, // signature_key
        emailAddress || phoneNumber || 'test@example.com', // recipient_email - required by schema
        signerName || null, // recipient_name
        signerName || null, // signer_name
        signerRole || null, // signer_role
        phoneNumber || null, // phone_number
        signerType || 'test', // signer_type - populate for consistency
        emailAddress || phoneNumber || null, // email_address - populate for consistency
        description || null,
        expiresAt.toISOString(),
      ]
    )

    // Build signature URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
                   process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 
                   (request.headers.get("origin") || "http://localhost:3000")
    const signatureUrl = `${baseUrl}/signature/${token}`

    return NextResponse.json({
      success: true,
      token,
      signatureUrl,
      expiresAt: expiresAt.toISOString(),
      visitFormId: visitFormId || null,
    })
  } catch (error: any) {
    console.error("Error creating signature token:", error)
    return NextResponse.json(
      {
        error: "Failed to create signature token",
        details: process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    )
  }
}

