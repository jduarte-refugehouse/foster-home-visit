import { NextResponse } from "next/server"
import { query } from "@/lib/db"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    console.log("🔍 Fetching users for admin panel...")

    const users = await query(
      `
      SELECT DISTINCT
        au.id,
        au.first_name,
        au.last_name,
        au.email,
        au.is_active,
        au.created_at,
        STRING_AGG(ur.role_name, ', ') as roles
      FROM app_users au
      LEFT JOIN user_roles ur ON au.id = ur.user_id 
        AND ur.is_active = 1
        AND ur.microservice_id IN (
          SELECT id FROM microservice_apps WHERE app_code = 'home-visits'
        )
      GROUP BY au.id, au.first_name, au.last_name, au.email, au.is_active, au.created_at
      ORDER BY au.created_at DESC
    `,
      [],
    )

    console.log(`✅ Found ${users.length} users`)

    const formattedUsers = users.map((user: any) => ({
      id: user.id,
      name: `${user.first_name || ""} ${user.last_name || ""}`.trim() || "Unknown User",
      email: user.email || "No email",
      status: user.is_active ? "Active" : "Inactive",
      roles: user.roles || "No roles",
      created: user.created_at ? new Date(user.created_at).toLocaleDateString() : "Unknown",
    }))

    return NextResponse.json({
      users: formattedUsers,
      total: formattedUsers.length,
    })
  } catch (error) {
    console.error("❌ Error fetching users:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch users",
        details: error instanceof Error ? error.message : "Unknown error",
        users: [],
        total: 0,
      },
      { status: 500 },
    )
  }
}
