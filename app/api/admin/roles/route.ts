import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { query } from "@/lib/db"

export async function GET() {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get all unique roles for the home-visits microservice
    const roles = await query(`
      SELECT DISTINCT
        ur.role_name,
        ur.role_name as role_display_name,
        1 as role_level,
        'User-defined role' as description,
        COUNT(ur.user_id) as user_count
      FROM user_roles ur
      INNER JOIN microservice_apps ma ON ur.microservice_id = ma.id
      WHERE ma.app_code = 'home-visits' AND ur.is_active = 1
      GROUP BY ur.role_name
      ORDER BY ur.role_name
    `)

    // Get permissions for each role (this is a simplified approach since we don't have role_permissions table)
    const rolesWithPermissions = await Promise.all(
      roles.map(async (role) => {
        // Get common permissions for users with this role
        const permissions = await query(
          `
          SELECT DISTINCT p.permission_code
          FROM user_permissions up
          INNER JOIN permissions p ON up.permission_id = p.id
          INNER JOIN user_roles ur ON up.user_id = ur.user_id
          INNER JOIN microservice_apps ma ON p.microservice_id = ma.id
          WHERE ur.role_name = @param0 
            AND ma.app_code = 'home-visits' 
            AND up.is_active = 1 
            AND ur.is_active = 1
        `,
          [role.role_name],
        )

        return {
          ...role,
          permissions: permissions.map((p) => p.permission_code).join(", "),
        }
      }),
    )

    return NextResponse.json(rolesWithPermissions)
  } catch (error) {
    console.error("Error fetching roles:", error)
    return NextResponse.json(
      { error: "Failed to fetch roles", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
