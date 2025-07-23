import { NextResponse } from "next/server"
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

    console.log("🔍 Fetching ALL permissions (no filters)...")

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
      ORDER BY category, permission_name
    `)

    console.log(`✅ Found ${allPermissions.length} permissions:`, allPermissions)

    // Get ALL microservice apps for reference
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
      ORDER BY app_name
    `)

    console.log(`✅ Found ${allApps.length} microservice apps:`, allApps)

    return NextResponse.json({
      permissions: allPermissions,
      microserviceApps: allApps,
      debug: {
        totalPermissions: allPermissions.length,
        totalApps: allApps.length,
      },
    })
  } catch (error) {
    console.error("❌ Error fetching permissions:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch permissions",
        details: error instanceof Error ? error.message : "Unknown error",
        permissions: [],
        microserviceApps: [],
      },
      { status: 500 },
    )
  }
}
