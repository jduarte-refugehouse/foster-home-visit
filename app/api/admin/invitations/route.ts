import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { getDbConnection } from "@/lib/db"

export async function GET() {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const pool = await getDbConnection()

    const result = await pool.request().query(`
      SELECT 
        id,
        email,
        role,
        status,
        created_at,
        expires_at
      FROM user_invitations 
      ORDER BY created_at DESC
    `)

    return NextResponse.json(result.recordset)
  } catch (error) {
    console.error("Error fetching invitations:", error)
    return NextResponse.json({ error: "Failed to fetch invitations" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { email, role } = await request.json()

    if (!email || !role) {
      return NextResponse.json({ error: "Email and role are required" }, { status: 400 })
    }

    const pool = await getDbConnection()

    // Check if invitation already exists
    const existingResult = await pool
      .request()
      .input("email", email)
      .query("SELECT id FROM user_invitations WHERE email = @email AND status = 'pending'")

    if (existingResult.recordset.length > 0) {
      return NextResponse.json({ error: "Invitation already exists for this email" }, { status: 400 })
    }

    // Create new invitation
    const invitationId = crypto.randomUUID()
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7) // Expires in 7 days

    await pool
      .request()
      .input("id", invitationId)
      .input("email", email)
      .input("role", role)
      .input("status", "pending")
      .input("created_by", userId)
      .input("expires_at", expiresAt)
      .query(`
        INSERT INTO user_invitations (id, email, role, status, created_by, expires_at, created_at)
        VALUES (@id, @email, @role, @status, @created_by, @expires_at, GETDATE())
      `)

    return NextResponse.json({ success: true, id: invitationId })
  } catch (error) {
    console.error("Error creating invitation:", error)
    return NextResponse.json({ error: "Failed to create invitation" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const invitationId = searchParams.get("id")

    if (!invitationId) {
      return NextResponse.json({ error: "Invitation ID is required" }, { status: 400 })
    }

    const pool = await getDbConnection()

    await pool.request().input("id", invitationId).query("DELETE FROM user_invitations WHERE id = @id")

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting invitation:", error)
    return NextResponse.json({ error: "Failed to delete invitation" }, { status: 500 })
  }
}
