import { NextResponse } from "next/server"
import { query } from "@/lib/db"

export const dynamic = "force-dynamic"

// Use the same microservice ID as system-status API
const HOME_VISITS_MICROSERVICE_ID = "1A5F93AC-9286-48FD-849D-BB132E5031C7"

export async function GET() {
  try {
    console.log("🔍 Fetching users for home-visits microservice...")

    // Get all users with their roles for this microservice
    const users = await query(
      `
      SELECT DISTINCT
        au.id,
        au.clerk_id,
        au.email,
        au.first_name,
        au.last_name,
        au.is_active,
        au.created_at,
        STRING_AGG(ur.role_name, ', ') as roles
      FROM app_users au
      LEFT JOIN user_roles ur ON au.id = ur.user_id 
        AND ur.microservice_id = @param0 
        AND ur.is_active = 1
      WHERE au.is_active = 1
      GROUP BY au.id, au.clerk_id, au.email, au.first_name, au.last_name, au.is_active, au.created_at
      ORDER BY au.created_at DESC
    `,
      [HOME_VISITS_MICROSERVICE_ID],
    )

    console.log(`✅ Found ${users.length} users for home-visits microservice`)

    // Transform the data to match the expected format
    const transformedUsers = users.map((user: any) => ({
      id: user.id,
      name: `${user.first_name || ""} ${user.last_name || ""}`.trim() || "Unknown User",
      email: user.email,
      status: user.is_active ? "Active" : "Inactive",
      roles: user.roles || "No roles",
      created: new Date(user.created_at).toLocaleDateString(),
    }))

    return NextResponse.json({
      users: transformedUsers,
      total: transformedUsers.length,
      microservice: {
        code: "home-visits",
        name: "Home Visits Application",
      },
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
