import { NextResponse, type NextRequest } from "next/server"
import { query } from "@/lib/db"
import { currentUser } from "@clerk/nextjs/server"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    // Get current user identity from Clerk (identity only, not authorization)
    const clerkUser = await currentUser()
    if (!clerkUser) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    // Check authorization using our own database system
    const appUser = await query("SELECT * FROM app_users WHERE clerk_user_id = @param0 AND is_active = 1", [
      clerkUser.id,
    ])

    if (appUser.length === 0) {
      return NextResponse.json({ error: "User not found in system" }, { status: 403 })
    }

    // Check if user has system admin permissions in our database
    const isSystemAdmin = appUser[0].core_role === "system_admin" || appUser[0].email === "jduarte@refugehouse.org"

    if (!isSystemAdmin) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    console.log("🔍 Fetching ALL users from app_users table (no filters)...")

    // Get ALL app users - no filters
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

    console.log(`✅ Found ${users.length} users in app_users table:`, users)

    // Get ALL user roles - no filters
    const allUserRoles = await query(`
      SELECT 
        id,
        user_id,
        microservice_id,
        role_name,
        granted_by,
        granted_at,
        is_active
      FROM user_roles
      ORDER BY granted_at DESC
    `)

    console.log(`✅ Found ${allUserRoles.length} user roles:`, allUserRoles)

    // Get ALL user permissions - no filters
    const allUserPermissions = await query(`
      SELECT 
        id,
        user_id,
        permission_id,
        granted_by,
        granted_at,
        expires_at,
        is_active
      FROM user_permissions
      ORDER BY granted_at DESC
    `)

    console.log(`✅ Found ${allUserPermissions.length} user permissions:`, allUserPermissions)

    // Get ALL permissions - no filters
    const allPermissions = await query(`
      SELECT 
        id,
        microservice_id,
        permission_code,
        permission_name,
        description,
        category,
        created_at
      FROM permissions
      ORDER BY created_at DESC
    `)

    console.log(`✅ Found ${allPermissions.length} permissions:`, allPermissions)

    // Get ALL microservice apps
    const allApps = await query(`
      SELECT 
        id,
        app_code,
        app_name,
        app_url,
        description,
        is_active,
        created_at
      FROM microservice_apps
      ORDER BY created_at DESC
    `)

    console.log(`✅ Found ${allApps.length} microservice apps:`, allApps)

    return NextResponse.json({
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
      },
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
    // Get current user identity from Clerk (identity only, not authorization)
    const clerkUser = await currentUser()
    if (!clerkUser) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    // Check authorization using our own database system
    const appUser = await query("SELECT * FROM app_users WHERE clerk_user_id = @param0 AND is_active = 1", [
      clerkUser.id,
    ])

    if (appUser.length === 0) {
      return NextResponse.json({ error: "User not found in system" }, { status: 403 })
    }

    // Check if user has system admin permissions in our database
    const isSystemAdmin = appUser[0].core_role === "system_admin" || appUser[0].email === "jduarte@refugehouse.org"

    if (!isSystemAdmin) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

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
