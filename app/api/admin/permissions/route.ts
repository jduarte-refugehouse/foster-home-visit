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

    console.log("🔍 Fetching ALL permissions (no filters)...")

    // Get ALL permissions - no filters
    const allPermissions = await query(`
      SELECT 
        id,
        microservice_id,
        permission_code,
        permission_name,
        description,
        category,
        created_at
      FROM permissions
      ORDER BY category, permission_name
    `)

    console.log(`✅ Found ${allPermissions.length} permissions:`, allPermissions)

    // Get ALL microservice apps for reference
    const allApps = await query(`
      SELECT 
        id,
        app_code,
        app_name,
        app_url,
        description,
        is_active,
        created_at
      FROM microservice_apps
      ORDER BY app_name
    `)

    console.log(`✅ Found ${allApps.length} microservice apps:`, allApps)

    return NextResponse.json({
      permissions: allPermissions,
      microserviceApps: allApps,
      debug: {
        totalPermissions: allPermissions.length,
        totalApps: allApps.length,
      },
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
