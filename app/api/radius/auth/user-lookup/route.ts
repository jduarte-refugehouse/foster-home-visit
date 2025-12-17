import { NextRequest, NextResponse } from "next/server"
import { validateApiKey } from "@/lib/api-auth"
import { query } from "@refugehouse/shared-core/db"

export const dynamic = "force-dynamic"

/**
 * GET /api/radius/auth/user-lookup
 * 
 * Look up a user by clerk_user_id or email
 * Used by microservices that don't have direct database access
 * 
 * Query Parameters:
 * - clerkUserId: Clerk user ID (optional)
 * - email: User email (optional)
 * 
 * At least one of clerkUserId or email must be provided
 * 
 * Returns: { success: boolean, user?: AppUser, roles?: UserRole[], permissions?: Permission[] }
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now()
  console.log(`🔵 [RADIUS-API] /api/radius/auth/user-lookup endpoint called at ${new Date().toISOString()}`)

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
    const clerkUserId = searchParams.get("clerkUserId")
    const email = searchParams.get("email")
    const microserviceCode = searchParams.get("microserviceCode") || validation.key?.microservice_code

    if (!clerkUserId && !email) {
      return NextResponse.json(
        {
          success: false,
          error: "Bad Request",
          details: "At least one of clerkUserId or email must be provided",
        },
        { status: 400 }
      )
    }

    console.log(`🔍 [RADIUS-API] Looking up user: clerkUserId=${clerkUserId}, email=${email}`)

    // 3. Look up user
    let user = null

    // Priority: clerk_user_id first, then email
    if (clerkUserId) {
      const result = await query<any>(
        `SELECT 
          id, clerk_user_id, email, first_name, last_name, phone,
          is_active, user_type, environment, created_at, updated_at
        FROM app_users 
        WHERE clerk_user_id = @param0 AND is_active = 1`,
        [clerkUserId]
      )
      user = result[0] || null
    }

    // If not found by clerk_user_id, try email
    if (!user && email) {
      const result = await query<any>(
        `SELECT 
          id, clerk_user_id, email, first_name, last_name, phone,
          is_active, user_type, environment, created_at, updated_at
        FROM app_users 
        WHERE email = @param0 AND is_active = 1`,
        [email]
      )
      user = result[0] || null
    }

    if (!user) {
      const duration = Date.now() - startTime
      console.log(`⚠️ [RADIUS-API] User not found: clerkUserId=${clerkUserId}, email=${email}`)
      return NextResponse.json({
        success: true,
        found: false,
        user: null,
        roles: [],
        permissions: [],
        timestamp: new Date().toISOString(),
        duration_ms: duration,
      })
    }

    // 4. Get user roles for the microservice
    let roles: any[] = []
    if (microserviceCode) {
      roles = await query<any>(
        `SELECT 
          ur.id, ur.user_id, ur.microservice_id, ur.role_name,
          ur.granted_by, ur.granted_at, ur.is_active,
          ma.app_code as microservice_code, ma.app_name as microservice_name
        FROM user_roles ur
        INNER JOIN microservice_apps ma ON ur.microservice_id = ma.id
        WHERE ur.user_id = @param0 AND ma.app_code = @param1 AND ur.is_active = 1
        ORDER BY ur.granted_at ASC`,
        [user.id, microserviceCode]
      )

      // Add computed fields (role_display_name and role_level)
      roles = roles.map((role: any) => ({
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
    }

    // 5. Get user permissions for the microservice
    let permissions: any[] = []
    if (microserviceCode) {
      permissions = await query<any>(
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
        [user.id, microserviceCode]
      )
    }

    const duration = Date.now() - startTime
    console.log(`✅ [RADIUS-API] User found: ${user.email}, ${roles.length} roles, ${permissions.length} permissions in ${duration}ms`)

    // 6. Return response
    return NextResponse.json({
      success: true,
      found: true,
      user,
      roles,
      permissions,
      timestamp: new Date().toISOString(),
      duration_ms: duration,
    })
  } catch (error) {
    const duration = Date.now() - startTime
    console.error("❌ [RADIUS-API] Error in user-lookup endpoint:", error)

    return NextResponse.json(
      {
        success: false,
        found: false,
        user: null,
        roles: [],
        permissions: [],
        error: error instanceof Error ? error.message : "Unknown error occurred",
        timestamp: new Date().toISOString(),
        duration_ms: duration,
      },
      { status: 500 }
    )
  }
}

