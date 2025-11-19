import { NextResponse } from "next/server"
import { query } from "@refugehouse/shared-core/db"
import { MICROSERVICE_CONFIG } from "@/lib/microservice-config"

export const dynamic = "force-dynamic"

const CURRENT_MICROSERVICE_CODE = MICROSERVICE_CONFIG.code

export async function GET() {
  try {
    console.log(`🔍 Fetching roles for ${CURRENT_MICROSERVICE_CODE} microservice...`)

    // Get microservice ID first
    const microservice = await query<{ id: string }>(
      "SELECT id FROM microservice_apps WHERE app_code = @param0 AND is_active = 1",
      [CURRENT_MICROSERVICE_CODE]
    )

    if (microservice.length === 0) {
      return NextResponse.json(
        {
          error: "Microservice not found",
          roles: [],
          total: 0,
        },
        { status: 404 }
      )
    }

    const microserviceId = microservice[0].id
    console.log(`🔍 [API] Fetching roles for microservice: ${CURRENT_MICROSERVICE_CODE} (ID: ${microserviceId})`)

    // Get all distinct roles from database (both active and inactive to show all available)
    // Note: user_roles table doesn't have role_display_name or role_level columns
    const roles = await query<{
      role_name: string
      user_count: number
    }>(
      `
      SELECT 
        ur.role_name,
        COUNT(DISTINCT ur.user_id) as user_count
      FROM user_roles ur
      WHERE ur.microservice_id = @param0
      GROUP BY ur.role_name
      ORDER BY ur.role_name
    `,
      [microserviceId],
    )

    console.log(`✅ [API] Found ${roles.length} roles in database for microservice ${CURRENT_MICROSERVICE_CODE}`)
    if (roles.length > 0) {
      console.log(`📋 [API] Role names:`, roles.map(r => r.role_name))
    }

    // Also get roles from config that might not be in database yet
    const configRoles = Object.values(MICROSERVICE_CONFIG.roles)
    const dbRoleNames = roles.map((r) => r.role_name)

    // Add config roles that aren't in database
    for (const configRole of configRoles) {
      if (!dbRoleNames.includes(configRole)) {
        const roleDisplayName = configRole.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
        roles.push({
          role_name: configRole,
          user_count: 0,
          role_display_name: roleDisplayName,
          role_level: configRole.includes("admin") ? 4 : configRole.includes("coordinator") ? 3 : configRole.includes("manager") ? 2 : 1,
        })
      }
    }

    console.log(`✅ Found ${roles.length} roles for ${CURRENT_MICROSERVICE_CODE} microservice`)

    // Generate display name and level from role_name
    const rolesWithDisplay = roles.map((r) => {
      const roleDisplayName = r.role_name.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
      // Calculate role level based on role name patterns
      const roleLevel = r.role_name.includes("admin") || r.role_name === "global_admin"
        ? 4
        : r.role_name.includes("director")
          ? 3
          : r.role_name.includes("liaison") || r.role_name.includes("coordinator") || r.role_name.includes("manager")
            ? 2
            : 1
      
      return {
        role_name: r.role_name,
        role_display_name: roleDisplayName,
        role_level: roleLevel,
        user_count: r.user_count,
      }
    })

    return NextResponse.json({
      roles: rolesWithDisplay,
      total: roles.length,
      microservice: {
        code: MICROSERVICE_CONFIG.code,
        name: MICROSERVICE_CONFIG.name,
      },
    })
  } catch (error) {
    console.error(`❌ Error fetching roles for ${MICROSERVICE_CONFIG.name}:`, error)
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
