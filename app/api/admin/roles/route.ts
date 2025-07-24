import { NextResponse } from "next/server"
import { query } from "@/lib/db"
import { MICROSERVICE_CONFIG } from "@/lib/microservice-config"

export const dynamic = "force-dynamic"

const CURRENT_MICROSERVICE_CODE = MICROSERVICE_CONFIG.code

export async function GET() {
  try {
    console.log(`🔍 Fetching roles for ${CURRENT_MICROSERVICE_CODE} microservice...`)

    // Use only columns that actually exist in user_roles table
    const roles = await query(
      `
      SELECT DISTINCT 
        ur.role_name,
        COUNT(ur.user_id) as user_count
      FROM user_roles ur
      INNER JOIN microservice_apps ma ON ur.microservice_id = ma.id
      WHERE ma.app_code = @param0 AND ur.is_active = 1
      GROUP BY ur.role_name
      ORDER BY ur.role_name
    `,
      [CURRENT_MICROSERVICE_CODE],
    )

    console.log(`✅ Found ${roles.length} roles for ${CURRENT_MICROSERVICE_CODE} microservice`)

    return NextResponse.json({
      roles,
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
