import { NextResponse, type NextRequest } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { query } from "@/lib/db"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("🔍 Fetching users from app_users table...")

    // Get all app users
    const users = await query(`
      SELECT 
        id,
        clerk_user_id,
        email,
        first_name,
        last_name,
        core_role,
        is_active,
        created_at,
        updated_at,
        department,
        job_title
      FROM app_users
      ORDER BY created_at DESC
    `)

    console.log(`✅ Found ${users.length} users in app_users table`)

    // Get users with their roles and permissions for the home-visits microservice
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
        AND ur.microservice_id = '1A5F93AC-9286-48FD-849D-BB132E5031C7'
      LEFT JOIN user_permissions up ON au.id = up.user_id 
        AND up.is_active = 1
      LEFT JOIN permissions p ON up.permission_id = p.id
        AND p.microservice_id = '1A5F93AC-9286-48FD-849D-BB132E5031C7'
      GROUP BY au.id, au.clerk_user_id, au.email, au.first_name, au.last_name, 
               au.core_role, au.is_active, au.created_at, au.updated_at, 
               au.department, au.job_title
      ORDER BY au.created_at DESC
    `)

    console.log(`✅ Found ${usersWithRoles.length} users with roles/permissions`)

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
    console.error("❌ Error fetching users:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch users",
        details: error instanceof Error ? error.message : "Unknown error",
        users: [],
        usersWithRoles: [],
        total: 0,
      },
      { status: 500 },
    )
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
      INSERT INTO app_users (email, first_name, last_name, core_role, is_active, created_at)
      OUTPUT INSERTED.*
      VALUES (@param0, @param1, @param2, @param3, 1, GETDATE())
    `,
      [email, firstName, lastName, role],
    )

    return NextResponse.json({ user: result[0] }, { status: 201 })
  } catch (error) {
    console.error("Error creating user:", error)
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 })
  }
}
