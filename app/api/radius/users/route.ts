import { NextRequest, NextResponse } from "next/server"
import { validateApiKey } from "@/lib/api-auth"
import { query } from "@refugehouse/shared-core/db"

export const dynamic = "force-dynamic"

/**
 * GET /api/radius/users
 * 
 * Proxy endpoint for accessing user data from RadiusBifrost
 * Requires API key authentication via x-api-key header
 * 
 * Query Parameters:
 * - microserviceCode: Filter users by microservice (optional, defaults to all)
 * - isActive: Filter by active status (optional, defaults to true)
 * 
 * Returns: { success: boolean, count: number, users: User[], timestamp: string }
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now()

  try {
    // 1. Validate API key
    const apiKeyRaw = request.headers.get("x-api-key")
    const apiKey = apiKeyRaw?.trim() || null // Trim whitespace from header value
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

    console.log(
      `✅ [RADIUS-API] Authenticated request from microservice: ${validation.key?.microservice_code}`
    )

    // 2. Parse query parameters
    const { searchParams } = new URL(request.url)
    const microserviceCode = searchParams.get("microserviceCode")
    const isActiveParam = searchParams.get("isActive")
    const isActive = isActiveParam === null ? true : isActiveParam === "true"

    // 3. Query RadiusBifrost directly
    console.log(`👥 [RADIUS-API] Fetching users with filters:`, {
      microserviceCode,
      isActive,
    })

    // Get base users
    const users = await query(
      `
      SELECT 
        id,
        clerk_user_id,
        email,
        first_name,
        last_name,
        is_active,
        created_at,
        updated_at
      FROM app_users
      WHERE is_active = @param0
      ORDER BY created_at DESC
    `,
      [isActive ? 1 : 0]
    )

    // If microservice code is provided, filter by microservice roles/permissions
    let filteredUsers = users
    if (microserviceCode) {
      const usersWithAccess = await query(
        `
        SELECT DISTINCT u.id
        FROM app_users u
        INNER JOIN user_roles ur ON u.id = ur.user_id
        INNER JOIN microservice_apps ma ON ur.microservice_id = ma.id
        WHERE ma.app_code = @param0 AND ur.is_active = 1 AND u.is_active = 1
        
        UNION
        
        SELECT DISTINCT u.id
        FROM app_users u
        INNER JOIN user_permissions up ON u.id = up.user_id
        INNER JOIN permissions p ON up.permission_id = p.id
        INNER JOIN microservice_apps ma ON p.microservice_id = ma.id
        WHERE ma.app_code = @param0 AND up.is_active = 1 AND u.is_active = 1
      `,
        [microserviceCode]
      )

      const userIds = new Set(usersWithAccess.map((u: any) => u.id))
      filteredUsers = users.filter((u: any) => userIds.has(u.id))
    }

    const duration = Date.now() - startTime

    console.log(
      `✅ [RADIUS-API] Successfully retrieved ${filteredUsers.length} users in ${duration}ms`
    )

    // 4. Return response
    return NextResponse.json({
      success: true,
      count: filteredUsers.length,
      users: filteredUsers,
      timestamp: new Date().toISOString(),
      duration_ms: duration,
    })
  } catch (error) {
    const duration = Date.now() - startTime
    console.error("❌ [RADIUS-API] Error in users endpoint:", error)

    return NextResponse.json(
      {
        success: false,
        count: 0,
        users: [],
        error: error instanceof Error ? error.message : "Unknown error occurred",
        timestamp: new Date().toISOString(),
        duration_ms: duration,
      },
      { status: 500 }
    )
  }
}

