import { NextResponse, type NextRequest } from "next/server"
import { query } from "@refugehouse/shared-core/db"
import { requireClerkAuth } from "@refugehouse/shared-core/auth"

export async function GET(request: NextRequest) {
  try {
    // SAFE: Get Clerk user ID from headers (no middleware required)
    try {
      requireClerkAuth(request)
    } catch (authError) {
      return NextResponse.json({ 
        error: "Unauthorized", 
        details: authError instanceof Error ? authError.message : "Missing authentication headers" 
      }, { status: 401 })
    }

    // Get all invited users
    const invitations = await query(`
      SELECT 
        id,
        email,
        invited_by,
        created_at,
        is_active
      FROM invited_users
      ORDER BY created_at DESC
    `)

    return NextResponse.json({
      invitations: invitations,
      total: invitations.length,
    })
  } catch (error) {
    console.error("Error fetching invitations:", error)
    return NextResponse.json(
      { error: "Failed to fetch invitations", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // SAFE: Get Clerk user ID from headers (no middleware required)
    try {
      requireClerkAuth(request)
    } catch (authError) {
      return NextResponse.json({ 
        error: "Unauthorized", 
        details: authError instanceof Error ? authError.message : "Missing authentication headers" 
      }, { status: 401 })
    }

    const { email, invitedBy } = await request.json()

    if (!email || !invitedBy) {
      return NextResponse.json({ error: "Email and invitedBy are required" }, { status: 400 })
    }

    // Check if user is already invited
    const existing = await query(
      `
      SELECT id FROM invited_users WHERE email = @param0
    `,
      [email],
    )

    if (existing.length > 0) {
      return NextResponse.json({ error: "User already invited" }, { status: 400 })
    }

    // Create invitation
    await query(
      `
      INSERT INTO invited_users (id, email, invited_by, created_at, is_active)
      VALUES (NEWID(), @param0, @param1, GETDATE(), 1)
    `,
      [email, invitedBy],
    )

    return NextResponse.json({ success: true, message: "Invitation created successfully" })
  } catch (error) {
    console.error("Error creating invitation:", error)
    return NextResponse.json(
      { error: "Failed to create invitation", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
