import { NextResponse } from "next/server"
import { query } from "@/lib/db"

export const dynamic = "force-dynamic"

// Home Visits microservice GUID
const HOME_VISITS_MICROSERVICE_ID = "1A5F93AC-9286-48FD-849D-BB132E5031C7"

export async function GET() {
  try {
    console.log("🔍 Fetching permissions filtered by home-visits microservice...")

    // Get permissions filtered by home-visits microservice only
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
      [HOME_VISITS_MICROSERVICE_ID],
    )

    console.log(`✅ Found ${permissions.length} permissions for home-visits microservice`)

    // Get the home-visits microservice app info
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
      [HOME_VISITS_MICROSERVICE_ID],
    )

    console.log(`✅ Found microservice app:`, microserviceApp[0])

    return NextResponse.json({
      permissions: permissions,
      microserviceApps: microserviceApp,
      total: permissions.length,
      microserviceId: HOME_VISITS_MICROSERVICE_ID,
      microserviceName: microserviceApp[0]?.app_name || "Home Visits",
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
