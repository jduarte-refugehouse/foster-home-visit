import { NextRequest, NextResponse } from "next/server"
import { validateApiKey } from "@/lib/api-auth"
import { query } from "@refugehouse/shared-core/db"

export const dynamic = "force-dynamic"

/**
 * GET /api/radius/permissions
 * 
 * Get user permissions and roles for a specific microservice
 * Used by microservices that don't have direct database access
 * 
 * Query Parameters:
 * - userId: App user ID (required)
 * - microserviceCode: Microservice code (optional, defaults to calling microservice)
 * 
 * Returns: { success: boolean, roles: [], permissions: [], permissionCodes: [] }
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now()
  console.log(`🔵 [RADIUS-API] /api/radius/permissions endpoint called at ${new Date().toISOString()}`)

  try {
    // 1. Validate API key
    const apiKeyRaw = request.headers.get("x-api-key")
    const apiKey = apiKeyRaw?.trim() || null
    const validation = await validateApiKey(apiKey)

    if (!validation.valid) {
      console.warn(`🚫 [RADIUS-API] Invalid API key attempt: ${validation.error}`)
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
          details: validation.error || "Invalid API key",
        },
        { status: 401 }
      )
    }

    console.log(`✅ [RADIUS-API] Authenticated request from microservice: ${validation.key?.microservice_code}`)

    // 2. Parse query parameters
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")
    const microserviceCode = searchParams.get("microserviceCode") || validation.key?.microservice_code

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: "Bad Request",
          details: "userId is required",
        },
        { status: 400 }
      )
    }

    if (!microserviceCode) {
      return NextResponse.json(
        {
          success: false,
          error: "Bad Request",
          details: "microserviceCode is required",
        },
        { status: 400 }
      )
    }

    console.log(`🔍 [RADIUS-API] Getting permissions for user=${userId}, microservice=${microserviceCode}`)

    // 3. Get user info
    const userResult = await query<any>(
      `SELECT id, email, first_name, last_name, core_role, is_active
       FROM app_users 
       WHERE id = @param0 AND is_active = 1`,
      [userId]
    )

    if (userResult.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Not Found",
          details: "User not found or inactive",
        },
        { status: 404 }
      )
    }

    const user = userResult[0]

    // 4. Get user roles for the microservice
    const rolesResult = await query<any>(
      `SELECT 
        ur.id, ur.user_id, ur.microservice_id, ur.role_name,
        ur.granted_by, ur.granted_at, ur.is_active,
        ma.app_code as microservice_code, ma.app_name as microservice_name
      FROM user_roles ur
      INNER JOIN microservice_apps ma ON ur.microservice_id = ma.id
      WHERE ur.user_id = @param0 AND ma.app_code = @param1 AND ur.is_active = 1
      ORDER BY ur.granted_at ASC`,
      [userId, microserviceCode]
    )

    // Add computed fields
    const roles = rolesResult.map((role: any) => ({
      ...role,
      role_display_name: role.role_name.replace(/_/g, " ").replace(/\b\w/g, (l: string) => l.toUpperCase()),
      role_level: role.role_name.includes("admin") || role.role_name === "global_admin"
        ? 4
        : role.role_name.includes("director")
          ? 3
          : role.role_name.includes("liaison") || role.role_name.includes("coordinator") || role.role_name.includes("manager")
            ? 2
            : 1
    }))

    // 5. Get user permissions for the microservice
    const permissionsResult = await query<any>(
      `SELECT DISTINCT 
        p.id, p.microservice_id, p.permission_code, p.permission_name,
        p.description, p.category,
        ma.app_code as microservice_code, ma.app_name as microservice_name
      FROM user_permissions up
      INNER JOIN permissions p ON up.permission_id = p.id
      INNER JOIN microservice_apps ma ON p.microservice_id = ma.id
      WHERE up.user_id = @param0 AND ma.app_code = @param1 
      AND up.is_active = 1 AND (up.expires_at IS NULL OR up.expires_at > GETDATE())
      ORDER BY p.category, p.permission_name`,
      [userId, microserviceCode]
    )

    // Extract just permission codes for easy checking
    const permissionCodes = permissionsResult.map((p: any) => p.permission_code)

    const duration = Date.now() - startTime
    console.log(`✅ [RADIUS-API] Permissions retrieved: ${roles.length} roles, ${permissionsResult.length} permissions in ${duration}ms`)

    // 6. Return response
    return NextResponse.json({
      success: true,
      userId,
      email: user.email,
      coreRole: user.core_role,
      microserviceCode,
      roles,
      permissions: permissionsResult,
      permissionCodes,
      roleNames: roles.map((r: any) => r.role_name),
      timestamp: new Date().toISOString(),
      duration_ms: duration,
    })
  } catch (error) {
    const duration = Date.now() - startTime
    console.error("❌ [RADIUS-API] Error in permissions endpoint:", error)

    return NextResponse.json(
      {
        success: false,
        roles: [],
        permissions: [],
        permissionCodes: [],
        roleNames: [],
        error: error instanceof Error ? error.message : "Unknown error occurred",
        timestamp: new Date().toISOString(),
        duration_ms: duration,
      },
      { status: 500 }
    )
  }
}

