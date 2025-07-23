import { NextResponse } from "next/server"
import { query } from "@/lib/db"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    console.log("🔍 Fetching ALL roles from user_roles table...")

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

    console.log(`✅ Found ${allRoles.length} roles:`, allRoles)

    // Get unique roles
    const uniqueRoles = allRoles.reduce((acc: any[], role: any) => {
      const existing = acc.find((r) => r.role_name === role.role_name)
      if (!existing) {
        acc.push({
          role_name: role.role_name,
          role_display_name: role.role_name,
          role_level: 1,
          description: `Role: ${role.role_name}`,
          user_count: allRoles.filter((r) => r.role_name === role.role_name).length,
          permissions: "Various permissions",
        })
      }
      return acc
    }, [])

    console.log(`✅ Found ${uniqueRoles.length} unique roles:`, uniqueRoles)

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
