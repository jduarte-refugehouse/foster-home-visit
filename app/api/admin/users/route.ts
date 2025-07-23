import { NextResponse, type NextRequest } from "next/server"
import { query } from "@/lib/db"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    console.log("🔍 Fetching ALL users from app_users table (no filters, no auth)...")

    // Use your exact query structure
    const users = await query(`
      SELECT 
        [id], 
        [clerk_user_id], 
        [email], 
        [first_name], 
        [last_name], 
        [core_role],
        [is_active], 
        [created_at], 
        [updated_at],
        [department],
        [job_title]
      FROM app_users
      ORDER BY created_at DESC
    `)

    console.log(`✅ Raw query result - Found ${users.length} users:`)
    console.log("Raw users data:", JSON.stringify(users, null, 2))

    // Get ALL user roles - no filters
    const allUserRoles = await query(`
      SELECT 
        [id],
        [user_id],
        [microservice_id],
        [role_name],
        [granted_by],
        [granted_at],
        [is_active]
      FROM user_roles
      ORDER BY granted_at DESC
    `)

    console.log(`✅ Found ${allUserRoles.length} user roles:`)
    console.log("Raw user roles data:", JSON.stringify(allUserRoles, null, 2))

    // Get ALL user permissions - no filters
    const allUserPermissions = await query(`
      SELECT 
        [id],
        [user_id],
        [permission_id],
        [granted_by],
        [granted_at],
        [expires_at],
        [is_active]
      FROM user_permissions
      ORDER BY granted_at DESC
    `)

    console.log(`✅ Found ${allUserPermissions.length} user permissions:`)
    console.log("Raw user permissions data:", JSON.stringify(allUserPermissions, null, 2))

    // Get ALL permissions - no filters
    const allPermissions = await query(`
      SELECT 
        [id],
        [microservice_id],
        [permission_code],
        [permission_name],
        [description],
        [category],
        [created_at]
      FROM permissions
      ORDER BY created_at DESC
    `)

    console.log(`✅ Found ${allPermissions.length} permissions:`)
    console.log("Raw permissions data:", JSON.stringify(allPermissions, null, 2))

    // Get ALL microservice apps
    const allApps = await query(`
      SELECT 
        [id],
        [app_code],
        [app_name],
        [app_url],
        [description],
        [is_active],
        [created_at]
      FROM microservice_apps
      ORDER BY created_at DESC
    `)

    console.log(`✅ Found ${allApps.length} microservice apps:`)
    console.log("Raw apps data:", JSON.stringify(allApps, null, 2))

    const responseData = {
      users: users,
      usersWithRoles: users, // For now, just return the same users
      userRoles: allUserRoles,
      userPermissions: allUserPermissions,
      permissions: allPermissions,
      microserviceApps: allApps,
      total: users.length,
      debug: {
        totalUsers: users.length,
        totalUserRoles: allUserRoles.length,
        totalUserPermissions: allUserPermissions.length,
        totalPermissions: allPermissions.length,
        totalApps: allApps.length,
        rawUsersLength: users.length,
        firstUser: users.length > 0 ? users[0] : null,
      },
    }

    console.log("✅ Final response data structure:")
    console.log("Response users array length:", responseData.users.length)
    console.log("Response debug info:", responseData.debug)

    return NextResponse.json(responseData)
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
