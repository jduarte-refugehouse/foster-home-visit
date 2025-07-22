import { NextResponse } from "next/server"
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
        clerk_user_id,
        email,
        first_name,
        last_name,
        role,
        status,
        last_login,
        created_at,
        updated_at
      FROM users 
      ORDER BY created_at DESC
    `)

    const users = result.recordset.map((user) => ({
      id: user.id,
      clerk_user_id: user.clerk_user_id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      full_name: `${user.first_name || ""} ${user.last_name || ""}`.trim(),
      role: user.role,
      status: user.status,
      last_login: user.last_login,
      created_at: user.created_at,
      updated_at: user.updated_at,
    }))

    return NextResponse.json(users)
  } catch (error) {
    console.error("Error fetching users:", error)
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 })
  }
}
