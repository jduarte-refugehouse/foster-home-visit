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

    console.log("🔍 Fetching ALL roles from user_roles table (no filters)...")

    // Get ALL roles - no filters
    const allRoles = await query(`
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

    console.log(`✅ Found ${allRoles.length} role assignments:`, allRoles)

    // Get unique role names with counts
    const uniqueRoles = await query(`
      SELECT 
        role_name,
        COUNT(*) as user_count,
        COUNT(CASE WHEN is_active = 1 THEN 1 END) as active_user_count
      FROM user_roles
      GROUP BY role_name
      ORDER BY role_name
    `)

    console.log(`✅ Found ${uniqueRoles.length} unique roles:`, uniqueRoles)

    return NextResponse.json({
      allRoles: allRoles,
      uniqueRoles: uniqueRoles,
      debug: {
        totalRoleAssignments: allRoles.length,
        uniqueRoleNames: uniqueRoles.length,
      },
    })
  } catch (error) {
    console.error("❌ Error fetching roles:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch roles",
        details: error instanceof Error ? error.message : "Unknown error",
        allRoles: [],
        uniqueRoles: [],
      },
      { status: 500 },
    )
  }
}
