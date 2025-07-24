import { NextResponse } from "next/server"
import { query } from "@/lib/db"
import { MICROSERVICE_CONFIG } from "@/lib/microservice-config"

export const dynamic = "force-dynamic"

const CURRENT_MICROSERVICE_CODE = MICROSERVICE_CONFIG.code

export async function GET() {
  try {
    console.log(`🔍 Fetching permissions for ${CURRENT_MICROSERVICE_CODE} microservice...`)

    // Use the same query pattern as system-status for permissions
    const permissions = await query(
      `
      SELECT 
        p.[id],
        p.[microservice_id],
        p.[permission_code],
        p.[permission_name],
        p.[description],
        p.[category],
        p.[created_at]
      FROM permissions p
      INNER JOIN microservice_apps ma ON p.microservice_id = ma.id
      WHERE ma.app_code = @param0
      ORDER BY p.category, p.permission_name
    `,
      [CURRENT_MICROSERVICE_CODE],
    )

    console.log(`✅ Found ${permissions.length} permissions for ${CURRENT_MICROSERVICE_CODE} microservice`)

    return NextResponse.json({
      permissions,
      total: permissions.length,
      microservice: {
        code: MICROSERVICE_CONFIG.code,
        name: MICROSERVICE_CONFIG.name,
      },
    })
  } catch (error) {
    console.error(`❌ Error fetching permissions for ${MICROSERVICE_CONFIG.name}:`, error)
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
