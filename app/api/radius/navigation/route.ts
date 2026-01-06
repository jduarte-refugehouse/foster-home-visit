import { NextRequest, NextResponse } from "next/server"
import { validateApiKey } from "@/lib/api-auth"
import { query } from "@refugehouse/shared-core/db"

export const dynamic = "force-dynamic"

/**
 * GET /api/radius/navigation
 * 
 * Get navigation items for a microservice, filtered by user permissions
 * Used by microservices that don't have direct database access
 * 
 * Query Parameters:
 * - userId: App user ID (required for permission filtering)
 * - microserviceCode: Microservice code (optional, defaults to calling microservice)
 * - userPermissions: JSON array of permission codes (optional, alternative to userId for filtering)
 * 
 * Returns: { success: boolean, navigation: [], collapsibleItems: [], metadata: {} }
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now()
  console.log(`🔵 [RADIUS-API] /api/radius/navigation endpoint called at ${new Date().toISOString()}`)

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
    const userPermissionsParam = searchParams.get("userPermissions")

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

    console.log(`🔍 [RADIUS-API] Getting navigation for microservice=${microserviceCode}, userId=${userId}`)

    // 3. Get user permissions (either from userId or passed directly)
    let userPermissions: string[] = []

    if (userPermissionsParam) {
      try {
        userPermissions = JSON.parse(userPermissionsParam)
      } catch (e) {
        console.warn("Failed to parse userPermissions, falling back to userId lookup")
      }
    }

    if (userId && userPermissions.length === 0) {
      // Fetch permissions from database
      const permissionsResult = await query<{ permission_code: string }>(
        `SELECT DISTINCT p.permission_code
         FROM user_permissions up
         INNER JOIN permissions p ON up.permission_id = p.id
         INNER JOIN microservice_apps ma ON p.microservice_id = ma.id
         WHERE up.user_id = @param0 AND ma.app_code = @param1 
         AND up.is_active = 1 AND (up.expires_at IS NULL OR up.expires_at > GETDATE())`,
        [userId, microserviceCode]
      )
      userPermissions = permissionsResult.map((p) => p.permission_code)
      console.log(`🔑 [RADIUS-API] User permissions from DB: [${userPermissions.join(", ")}]`)
    }

    // 4. Get microservice ID
    const microserviceResult = await query<{ id: string; app_name: string; description: string }>(
      `SELECT id, app_name, description FROM microservice_apps 
       WHERE app_code = @param0 AND is_active = 1`,
      [microserviceCode]
    )

    if (microserviceResult.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Not Found",
          details: `Microservice '${microserviceCode}' not found`,
        },
        { status: 404 }
      )
    }

    const microserviceId = microserviceResult[0].id
    const microserviceInfo = {
      code: microserviceCode,
      name: microserviceResult[0].app_name,
      description: microserviceResult[0].description,
    }

    // 5. Get navigation items from database
    const navigationResult = await query<any>(
      `SELECT 
        ni.id,
        ni.code,
        ni.title,
        ni.url,
        ni.icon,
        ni.permission_required,
        ni.category,
        ni.subcategory,
        ni.order_index,
        ISNULL(ni.is_collapsible, 0) as is_collapsible,
        ISNULL(ni.item_type, 'domain') as item_type,
        ma.app_name,
        ma.app_code,
        ma.description
      FROM navigation_items ni
      INNER JOIN microservice_apps ma ON ni.microservice_id = ma.id
      WHERE ni.microservice_id = @param0 
        AND ni.is_active = 1
        AND ma.is_active = 1
      ORDER BY 
        ni.is_collapsible,
        ni.category, 
        ni.order_index, 
        ni.subcategory`,
      [microserviceId]
    )

    console.log(`📋 [RADIUS-API] Found ${navigationResult.length} navigation items`)

    // 6. Filter by permissions
    const checkPermission = (item: any): boolean => {
      if (!item.permission_required || item.permission_required.trim() === "") {
        return true // No permission required
      }

      const hasPermission = userPermissions.some((userPerm) => {
        // Direct match
        if (userPerm === item.permission_required) return true

        // Check for admin permissions that should grant access
        if (item.permission_required === "admin" && userPerm === "system_admin") return true
        if (item.permission_required === "user_manage" && (userPerm === "manage_users" || userPerm === "system_admin")) return true
        if (item.permission_required === "admin.view" && (userPerm === "system_admin" || userPerm === "manage_users")) return true
        if (item.permission_required === "system_config" && userPerm === "system_admin") return true
        if (item.permission_required === "system_admin_access" && userPerm === "system_admin_access") return true

        return false
      })

      return hasPermission
    }

    // Separate items into fixed and collapsible based on is_collapsible flag
    const fixedItems: any[] = []
    const collapsibleItems: any[] = []
    let visibleItemCount = 0
    let filteredItemCount = 0

    navigationResult.forEach((item: any) => {
      if (!checkPermission(item)) {
        console.log(`🔒 [RADIUS-API] FILTERING OUT '${item.title}' - requires permission: '${item.permission_required}'`)
        filteredItemCount++
        return
      }

      const navItem = {
        code: item.code,
        title: item.title,
        url: item.url,
        icon: item.icon,
        order: item.order_index,
        category: item.category || "Administration",
        item_type: item.item_type || "domain",
      }

      // Separate based on is_collapsible flag
      if (item.is_collapsible === 1 || item.is_collapsible === true) {
        collapsibleItems.push(navItem)
      } else {
        fixedItems.push(navItem)
      }

      visibleItemCount++
    })

    // Sort items within each group
    fixedItems.sort((a, b) => a.order - b.order)
    collapsibleItems.sort((a, b) => a.order - b.order)

    // Group fixed items by category
    const fixedByCategory: { [category: string]: any[] } = {}
    fixedItems.forEach((item) => {
      if (!fixedByCategory[item.category]) {
        fixedByCategory[item.category] = []
      }
      fixedByCategory[item.category].push(item)
    })

    // Convert to array format
    const navigation = Object.entries(fixedByCategory).map(([category, items]) => ({
      title: category,
      items: items.sort((a, b) => a.order - b.order),
    }))

    const duration = Date.now() - startTime
    console.log(`✅ [RADIUS-API] Navigation retrieved: ${visibleItemCount} visible, ${filteredItemCount} filtered in ${duration}ms`)

    // 7. Return response
    return NextResponse.json({
      success: true,
      navigation,
      collapsibleItems: collapsibleItems.length > 0 ? collapsibleItems : undefined,
      metadata: {
        source: "database",
        totalItems: navigationResult.length,
        visibleItems: visibleItemCount,
        fixedItems: fixedItems.length,
        collapsibleItems: collapsibleItems.length,
        filteredItems: filteredItemCount,
        microservice: microserviceInfo,
        userPermissions,
      },
      timestamp: new Date().toISOString(),
      duration_ms: duration,
    })
  } catch (error) {
    const duration = Date.now() - startTime
    console.error("❌ [RADIUS-API] Error in navigation endpoint:", error)

    return NextResponse.json(
      {
        success: false,
        navigation: [],
        collapsibleItems: [],
        metadata: {
          source: "error",
          error: error instanceof Error ? error.message : "Unknown error",
        },
        error: error instanceof Error ? error.message : "Unknown error occurred",
        timestamp: new Date().toISOString(),
        duration_ms: duration,
      },
      { status: 500 }
    )
  }
}

