import { NextResponse } from "next/server"
import { query } from "@/lib/db"
import { MICROSERVICE_CONFIG } from "@/lib/microservice-config"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    console.log("🔍 Fetching permissions filtered by current microservice...")

    // Get the microservice ID from the database using the configurable code
    const microserviceResult = await query(`SELECT id FROM microservice_apps WHERE app_code = @param0`, [
      MICROSERVICE_CONFIG.code,
    ])

    if (microserviceResult.length === 0) {
      console.error(`❌ Microservice with code '${MICROSERVICE_CONFIG.code}' not found`)
      return NextResponse.json(
        {
          error: `Microservice '${MICROSERVICE_CONFIG.code}' not found`,
          permissions: [],
          microserviceApps: [],
        },
        { status: 404 },
      )
    }

    const microserviceId = microserviceResult[0].id

    // Get permissions filtered by current microservice only
    const permissions = await query(
      `
      SELECT 
        [id],
        [microservice_id],
        [permission_code],
        [permission_name],
        [description],
        [category],
        [created_at]
      FROM permissions
      WHERE microservice_id = @param0
      ORDER BY category, permission_name
    `,
      [microserviceId],
    )

    console.log(`✅ Found ${permissions.length} permissions for ${MICROSERVICE_CONFIG.name} microservice`)

    // Get the current microservice app info
    const microserviceApp = await query(
      `
      SELECT 
        [id],
        [app_code],
        [app_name],
        [app_url],
        [description],
        [is_active],
        [created_at]
      FROM microservice_apps
      WHERE id = @param0
    `,
      [microserviceId],
    )

    console.log(`✅ Found microservice app:`, microserviceApp[0])

    return NextResponse.json({
      permissions: permissions,
      microserviceApps: microserviceApp,
      total: permissions.length,
      microserviceId: microserviceId,
      microserviceName: microserviceApp[0]?.app_name || MICROSERVICE_CONFIG.name,
    })
  } catch (error) {
    console.error("❌ Error fetching permissions:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch permissions",
        details: error instanceof Error ? error.message : "Unknown error",
        permissions: [],
        microserviceApps: [],
      },
      { status: 500 },
    )
  }
}
