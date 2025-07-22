import { type NextRequest, NextResponse } from "next/server"
import { headers } from "next/headers"
import { query } from "@/lib/db"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const headersList = await headers()

    // Get all users from database
    const users = await query(`
      SELECT 
        id,
        email,
        first_name,
        last_name,
        role,
        status,
        created_at,
        last_login
      FROM Users 
      ORDER BY last_name, first_name
    `)

    return NextResponse.json({ users })
  } catch (error) {
    console.error("Error fetching users:", error)
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, firstName, lastName, role = "user" } = body

    if (!email || !firstName || !lastName) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Create new user
    const result = await query(
      `
      INSERT INTO Users (email, first_name, last_name, role, status, created_at)
      OUTPUT INSERTED.*
      VALUES (@param0, @param1, @param2, @param3, 'active', GETDATE())
    `,
      [email, firstName, lastName, role],
    )

    return NextResponse.json({ user: result[0] }, { status: 201 })
  } catch (error) {
    console.error("Error creating user:", error)
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 })
  }
}
