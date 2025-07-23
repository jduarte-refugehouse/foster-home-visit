import { NextResponse } from "next/server"
import { query } from "@/lib/db"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    console.log("🔍 Fetching ALL roles from user_roles table (no filters)...")

    // Get all user roles
    const allRoles = await query(`
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

    console.log(`✅ Found ${allRoles.length} roles:`)
    console.log("Raw roles data:", JSON.stringify(allRoles, null, 2))

    // Get unique role names with counts
    const uniqueRoles = await query(`
      SELECT 
        [role_name],
        COUNT(*) as user_count,
        COUNT(CASE WHEN is_active = 1 THEN 1 END) as active_count
      FROM user_roles
      GROUP BY [role_name]
      ORDER BY user_count DESC
    `)

    console.log(`✅ Found ${uniqueRoles.length} unique roles:`)
    console.log("Unique roles data:", JSON.stringify(uniqueRoles, null, 2))

    return NextResponse.json({
      allRoles: allRoles,
      uniqueRoles: uniqueRoles,
      total: allRoles.length,
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
