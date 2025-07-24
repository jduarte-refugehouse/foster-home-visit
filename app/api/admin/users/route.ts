import { type NextRequest, NextResponse } from "next/server"
import { getCurrentAppUser, CURRENT_MICROSERVICE } from "@/lib/user-management"
import { MICROSERVICE_CONFIG } from "@/lib/microservice-config"
import { query } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    console.log("🔍 [Admin Users API] Starting users fetch...")

    // Get current user for authorization
    const currentUser = await getCurrentAppUser()
    if (!currentUser) {
      console.log("❌ [Admin Users API] No authenticated user")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("✅ [Admin Users API] User authenticated:", currentUser.email)

    // Get users with their roles for the current microservice
    const usersWithRoles = await query(
      `
      SELECT 
        u.id,
        u.clerk_user_id,
        u.email,
        u.first_name,
        u.last_name,
        u.core_role,
        u.department,
        u.job_title,
        u.is_active,
        u.created_at,
        u.updated_at,
        STRING_AGG(ur.role_display_name, ', ') as roles
      FROM app_users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id AND ur.is_active = 1
      LEFT JOIN microservice_apps ma ON ur.microservice_id = ma.id AND ma.app_code = @param0
      WHERE u.is_active = 1
      GROUP BY u.id, u.clerk_user_id, u.email, u.first_name, u.last_name, u.core_role, 
               u.department, u.job_title, u.is_active, u.created_at, u.updated_at
      ORDER BY u.created_at DESC
    `,
      [CURRENT_MICROSERVICE],
    )

    console.log("✅ [Admin Users API] Users with roles fetched:", usersWithRoles.length)

    // Transform the data to match expected format
    const transformedUsers = usersWithRoles.map((user) => ({
      ...user,
      roles: user.roles ? user.roles.split(", ").filter(Boolean) : [],
    }))

    return NextResponse.json({
      users: transformedUsers,
      usersWithRoles: transformedUsers, // For backward compatibility
      microservice: {
        code: MICROSERVICE_CONFIG.code,
        name: MICROSERVICE_CONFIG.name,
      },
    })
  } catch (error) {
    console.error(`❌ [Admin Users API] Error fetching users for ${MICROSERVICE_CONFIG.name}:`, error)
    return NextResponse.json(
      {
        error: "Failed to fetch users",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
