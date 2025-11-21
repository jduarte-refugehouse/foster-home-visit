import { NextResponse, type NextRequest } from "next/server"
import { query } from "@refugehouse/shared-core/db"
import { requireClerkAuth } from "@refugehouse/shared-core/auth"
import { checkPermission } from "@refugehouse/shared-core/permissions"
import { CURRENT_MICROSERVICE } from "@refugehouse/shared-core/user-management"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function GET(request: NextRequest) {
  try {
    // SAFE: Get Clerk user ID from headers (no middleware required)
    try {
      const auth = requireClerkAuth(request)
    } catch (authError) {
      console.error("❌ [API] Auth error in microservices GET:", authError)
      return NextResponse.json({ 
        error: "Authentication failed", 
        details: authError instanceof Error ? authError.message : "Missing authentication headers" 
      }, { status: 401 })
    }

    // Check permissions - use system_admin
    try {
      const permissionCheck = await checkPermission(["system_admin"], CURRENT_MICROSERVICE, request)
      if (!permissionCheck.authorized) {
        console.log(`⚠️ [API] Permission check failed: ${permissionCheck.reason}`)
        return NextResponse.json({ error: "Insufficient permissions", reason: permissionCheck.reason }, { status: 403 })
      }
    } catch (permError) {
      console.error("❌ [API] Permission check error:", permError)
      return NextResponse.json({ error: "Permission check failed", details: permError instanceof Error ? permError.message : "Unknown error" }, { status: 500 })
    }

    const microservices = await query<{
      id: string
      app_code: string
      app_name: string
      description: string | null
      app_url: string | null
      is_active: number
    }>(
      "SELECT id, app_code, app_name, description, app_url, is_active FROM microservice_apps WHERE is_active = 1 ORDER BY app_name",
      []
    )

    return NextResponse.json({
      success: true,
      microservices: microservices.map(ms => ({
        id: ms.id,
        app_code: ms.app_code,
        app_name: ms.app_name,
        description: ms.description,
        app_url: ms.app_url,
        is_active: ms.is_active === 1,
      })),
    })
  } catch (error) {
    console.error("❌ [API] Error fetching microservices:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch microservices",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}

