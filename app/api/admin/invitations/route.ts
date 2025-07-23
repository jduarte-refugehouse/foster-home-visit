import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { query } from "@/lib/db"

export async function GET() {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
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

export async function POST(request: Request) {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
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
