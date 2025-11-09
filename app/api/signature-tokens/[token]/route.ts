import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"

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
      `SELECT token_id, visit_form_id, signature_key, expires_at, used_at
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

    // Get current visit form data
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

