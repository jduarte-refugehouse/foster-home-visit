import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { query } from "@/lib/db"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
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
