import { type NextRequest, NextResponse } from "next/server"
import { getCurrentAppUser, getAllDefinedRoles, CURRENT_MICROSERVICE } from "@/lib/user-management"
import { MICROSERVICE_CONFIG } from "@/lib/microservice-config"
import { query } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    console.log("🔍 [Admin Roles API] Starting roles fetch...")

    // Get current user for authorization
    const currentUser = await getCurrentAppUser()
    if (!currentUser) {
      console.log("❌ [Admin Roles API] No authenticated user")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("✅ [Admin Roles API] User authenticated:", currentUser.email)

    // Get roles with user counts
    const rolesWithCounts = await query(
      `
      SELECT 
        r.role_name,
        r.role_display_name,
        r.role_level,
        COUNT(DISTINCT ur.user_id) as user_count,
        COUNT(DISTINCT CASE WHEN u.is_active = 1 THEN ur.user_id END) as active_user_count,
        STRING_AGG(p.permission_code, ', ') as permissions
      FROM (
        SELECT DISTINCT role_name, role_display_name, role_level
        FROM user_roles ur2
        INNER JOIN microservice_apps ma2 ON ur2.microservice_id = ma2.id
        WHERE ma2.app_code = @param0 AND ur2.is_active = 1
      ) r
      LEFT JOIN user_roles ur ON r.role_name = ur.role_name AND ur.is_active = 1
      LEFT JOIN microservice_apps ma ON ur.microservice_id = ma.id AND ma.app_code = @param0
      LEFT JOIN app_users u ON ur.user_id = u.id
      LEFT JOIN role_permissions rp ON r.role_name = rp.role_name
      LEFT JOIN permissions p ON rp.permission_id = p.id
      GROUP BY r.role_name, r.role_display_name, r.role_level
      ORDER BY r.role_level DESC, r.role_name
    `,
      [CURRENT_MICROSERVICE],
    )

    console.log("✅ [Admin Roles API] Roles with counts:", rolesWithCounts)

    // Also get the defined roles from config as fallback
    const definedRoles = await getAllDefinedRoles(CURRENT_MICROSERVICE)
    console.log("✅ [Admin Roles API] Defined roles from config:", definedRoles)

    // Combine actual roles with defined roles
    const allRoles = [...rolesWithCounts]

    // Add any missing roles from config
    for (const definedRole of definedRoles) {
      const exists = rolesWithCounts.find((r) => r.role_name === definedRole.role_name)
      if (!exists) {
        allRoles.push({
          ...definedRole,
          user_count: 0,
          active_user_count: 0,
          permissions: "",
        })
      }
    }

    console.log("✅ [Admin Roles API] Final roles list:", allRoles)

    return NextResponse.json({
      roles: allRoles,
      uniqueRoles: allRoles, // For backward compatibility
      microservice: {
        code: MICROSERVICE_CONFIG.code,
        name: MICROSERVICE_CONFIG.name,
      },
    })
  } catch (error) {
    console.error(`❌ [Admin Roles API] Error fetching roles for ${MICROSERVICE_CONFIG.name}:`, error)
    return NextResponse.json(
      {
        error: "Failed to fetch roles",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
