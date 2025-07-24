import { NextResponse } from "next/server"
import { query } from "@/lib/db"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    console.log("🔍 Fetching roles for admin panel...")

    // Use the EXACT same query logic as system-status for roles count
    // This should match the query that produces "2" in the card
    const roles = await query(
      `
      SELECT DISTINCT 
        ur.role_name,
        ur.role_display_name,
        ur.role_level,
        COUNT(ur.user_id) as user_count,
        COUNT(CASE WHEN au.is_active = 1 THEN ur.user_id END) as active_user_count
      FROM user_roles ur
      INNER JOIN microservice_apps ma ON ur.microservice_id = ma.id
      INNER JOIN app_users au ON ur.user_id = au.id
      WHERE ma.app_code = 'home-visits' AND ur.is_active = 1
      GROUP BY ur.role_name, ur.role_display_name, ur.role_level
      ORDER BY ur.role_level DESC, ur.role_name
    `,
      [],
    )

    console.log(`✅ Found ${roles.length} roles for home-visits microservice`)
    console.log("📋 Roles data:", roles)

    return NextResponse.json({
      roles,
      total: roles.length,
      microservice: {
        code: "home-visits",
        name: "Home Visits Application",
      },
    })
  } catch (error) {
    console.error("❌ Error fetching roles:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch roles",
        details: error instanceof Error ? error.message : "Unknown error",
        roles: [],
        total: 0,
      },
      { status: 500 },
    )
  }
}
