import { NextResponse } from "next/server"
import { query } from "@/lib/db"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    console.log("🔍 Fetching ALL permissions from permissions table (no filters)...")

    // Get all permissions
    const permissions = await query(`
      SELECT 
        [id],
        [microservice_id],
        [permission_code],
        [permission_name],
        [description],
        [category],
        [created_at]
      FROM permissions
      ORDER BY created_at DESC
    `)

    console.log(`✅ Found ${permissions.length} permissions:`)
    console.log("Raw permissions data:", JSON.stringify(permissions, null, 2))

    // Get all microservice apps
    const microserviceApps = await query(`
      SELECT 
        [id],
        [app_code],
        [app_name],
        [app_url],
        [description],
        [is_active],
        [created_at]
      FROM microservice_apps
      ORDER BY created_at DESC
    `)

    console.log(`✅ Found ${microserviceApps.length} microservice apps:`)
    console.log("Raw microservice apps data:", JSON.stringify(microserviceApps, null, 2))

    return NextResponse.json({
      permissions: permissions,
      microserviceApps: microserviceApps,
      total: permissions.length,
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
