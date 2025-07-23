import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { query } from "@/lib/db"

export async function GET() {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get all app users
    const users = await query(`
      SELECT 
        au.id,
        au.clerk_user_id,
        au.email,
        au.first_name,
        au.last_name,
        au.core_role,
        au.is_active,
        au.created_at,
        au.updated_at,
        au.department,
        au.job_title
      FROM app_users au
      ORDER BY au.created_at DESC
    `)

    // Get users with their roles and permissions for this microservice
    const usersWithRoles = await query(`
      SELECT 
        au.id,
        au.clerk_user_id,
        au.email,
        au.first_name,
        au.last_name,
        au.core_role,
        au.is_active,
        au.created_at,
        au.updated_at,
        au.department,
        au.job_title,
        STRING_AGG(DISTINCT ur.role_name, ', ') as roles,
        STRING_AGG(DISTINCT p.permission_code, ', ') as permissions
      FROM app_users au
      LEFT JOIN user_roles ur ON au.id = ur.user_id 
        AND ur.is_active = 1 
        AND ur.microservice_id = (SELECT id FROM microservice_apps WHERE app_code = 'home-visits')
      LEFT JOIN user_permissions up ON au.id = up.user_id 
        AND up.is_active = 1
      LEFT JOIN permissions p ON up.permission_id = p.id
        AND p.microservice_id = (SELECT id FROM microservice_apps WHERE app_code = 'home-visits')
      GROUP BY au.id, au.clerk_user_id, au.email, au.first_name, au.last_name, 
               au.core_role, au.is_active, au.created_at, au.updated_at, 
               au.department, au.job_title
      ORDER BY au.created_at DESC
    `)

    // Process the users with roles data
    const processedUsersWithRoles = usersWithRoles.map((user) => ({
      ...user,
      roles: user.roles ? user.roles.split(", ").filter((r) => r) : [],
      permissions: user.permissions ? user.permissions.split(", ").filter((p) => p) : [],
      microservice_roles: [], // Will be populated separately if needed
    }))

    return NextResponse.json({
      users: users,
      usersWithRoles: processedUsersWithRoles,
      total: users.length,
    })
  } catch (error) {
    console.error("Error fetching users:", error)
    return NextResponse.json(
      { error: "Failed to fetch users", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
