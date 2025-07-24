import { type NextRequest, NextResponse } from "next/server"
import { getCurrentAppUser, getAllDefinedPermissions, CURRENT_MICROSERVICE } from "@/lib/user-management"
import { MICROSERVICE_CONFIG } from "@/lib/microservice-config"

export async function GET(request: NextRequest) {
  try {
    console.log("🔍 [Admin Permissions API] Starting permissions fetch...")

    // Get current user for authorization
    const currentUser = await getCurrentAppUser()
    if (!currentUser) {
      console.log("❌ [Admin Permissions API] No authenticated user")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("✅ [Admin Permissions API] User authenticated:", currentUser.email)

    // Get permissions for the current microservice
    const permissions = await getAllDefinedPermissions(CURRENT_MICROSERVICE)
    console.log("✅ [Admin Permissions API] Permissions fetched:", permissions)

    // If no permissions found in database, return the configured permissions
    if (permissions.length === 0) {
      console.log("⚠️ [Admin Permissions API] No permissions in database, using config...")
      const configPermissions = Object.entries(MICROSERVICE_CONFIG.permissions).map(([key, code]) => ({
        id: `config-${key}`,
        permission_code: code,
        permission_name: code.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
        description: `${code.replace(/_/g, " ")} permission`,
        category: code.split("_")[0] || "general",
        created_at: new Date().toISOString(),
      }))

      return NextResponse.json({
        permissions: configPermissions,
        microservice: {
          code: MICROSERVICE_CONFIG.code,
          name: MICROSERVICE_CONFIG.name,
        },
      })
    }

    return NextResponse.json({
      permissions,
      microservice: {
        code: MICROSERVICE_CONFIG.code,
        name: MICROSERVICE_CONFIG.name,
      },
    })
  } catch (error) {
    console.error(`❌ [Admin Permissions API] Error fetching permissions for ${MICROSERVICE_CONFIG.name}:`, error)
    return NextResponse.json(
      {
        error: "Failed to fetch permissions",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
