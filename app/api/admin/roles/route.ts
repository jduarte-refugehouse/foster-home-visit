import { NextResponse } from "next/server"
import { query } from "@/lib/db"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    console.log("🔍 Fetching ALL roles from user_roles table (no filters, no auth)...")

    // Get ALL roles - no filters, no auth checks
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
