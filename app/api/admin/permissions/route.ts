import { NextResponse } from "next/server"
import { query } from "@/lib/db"
import { MICROSERVICE_CONFIG } from "@/lib/microservice-config"

export const dynamic = "force-dynamic"

// Use the same microservice ID as system-status API
const HOME_VISITS_MICROSERVICE_ID = "1A5F93AC-9286-48FD-849D-BB132E5031C7"

export async function GET() {
  try {
    console.log("🔍 Fetching permissions for home-visits microservice...")

    // Get permissions from the database
    const dbPermissions = await query(
      `
      SELECT DISTINCT 
        permission_name,
        permission_display_name,
        COUNT(user_id) as user_count
      FROM user_permissions up
      WHERE microservice_id = @param0 AND is_active = 1
      GROUP BY permission_name, permission_display_name
      ORDER BY permission_name
    `,
      [HOME_VISITS_MICROSERVICE_ID],
    )

    console.log(`✅ Found ${dbPermissions.length} permissions in database`)

    // If no permissions in database, fall back to configured permissions
    let permissions = dbPermissions
    if (permissions.length === 0) {
      console.log("📋 No permissions in database, using configured permissions...")
      permissions = MICROSERVICE_CONFIG.permissions.map((perm: any) => ({
        permission_name: perm.code,
        permission_display_name: perm.name,
        user_count: 0,
      }))
    }

    return NextResponse.json({
      permissions,
      total: permissions.length,
      microservice: {
        code: MICROSERVICE_CONFIG.code,
        name: MICROSERVICE_CONFIG.name,
      },
    })
  } catch (error) {
    console.error("❌ Error fetching permissions:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch permissions",
        details: error instanceof Error ? error.message : "Unknown error",
        permissions: [],
        total: 0,
      },
      { status: 500 },
    )
  }
}
