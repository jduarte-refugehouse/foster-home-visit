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

    console.log("🔍 Fetching roles from user_roles table...")

    // Get all unique roles for the home-visits microservice using the actual GUID
    const roles = await query(`
      SELECT DISTINCT
        ur.role_name,
        ur.role_name as role_display_name,
        1 as role_level,
        'User-defined role for home-visits microservice' as description,
        COUNT(ur.user_id) as user_count
      FROM user_roles ur
      WHERE ur.microservice_id = '1A5F93AC-9286-48FD-849D-BB132E5031C7' 
        AND ur.is_active = 1
      GROUP BY ur.role_name
      ORDER BY ur.role_name
    `)

    console.log(`✅ Found ${roles.length} roles in user_roles table`)

    // Get permissions for each role
    const rolesWithPermissions = await Promise.all(
      roles.map(async (role) => {
        console.log(`🔍 Getting permissions for role: ${role.role_name}`)

        // Get common permissions for users with this role
        const permissions = await query(
          `
          SELECT DISTINCT p.permission_code
          FROM user_permissions up
          INNER JOIN permissions p ON up.permission_id = p.id
          INNER JOIN user_roles ur ON up.user_id = ur.user_id
          WHERE ur.role_name = @param0 
            AND ur.microservice_id = '1A5F93AC-9286-48FD-849D-BB132E5031C7'
            AND p.microservice_id = '1A5F93AC-9286-48FD-849D-BB132E5031C7'
            AND up.is_active = 1 
            AND ur.is_active = 1
        `,
          [role.role_name],
        )

        console.log(`✅ Found ${permissions.length} permissions for role ${role.role_name}`)

        return {
          ...role,
          permissions: permissions.map((p) => p.permission_code).join(", "),
        }
      }),
    )

    return NextResponse.json(rolesWithPermissions)
  } catch (error) {
    console.error("❌ Error fetching roles:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch roles",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
