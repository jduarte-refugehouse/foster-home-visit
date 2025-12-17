import { NextRequest, NextResponse } from "next/server"
import { requireClerkAuth } from "@refugehouse/shared-core/auth"
import { query } from "@refugehouse/shared-core/db"
import { getMicroserviceCode } from "@/lib/microservice-config"

export const dynamic = "force-dynamic"

/**
 * POST /api/admin/test-radius-api
 * 
 * Test endpoint that directly calls the same database queries as the Radius API endpoints
 * Since we're IN the admin project, we have direct database access - no API client needed!
 * 
 * CORRECT PATTERN: Uses requireClerkAuth which reads identity from headers
 * (set by client-side Clerk). Authorization happens via database lookup.
 */
export async function POST(request: NextRequest) {
  try {
    // CORRECT: Get Clerk identity from headers (identity only - no Clerk authorization)
    let auth
    try {
      auth = requireClerkAuth(request)
    } catch (authError) {
      return NextResponse.json(
        {
          error: "Unauthorized",
          details: authError instanceof Error ? authError.message : "Missing authentication headers",
        },
        { status: 401 }
      )
    }

    if (!auth.clerkUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { endpoint, method, params, requestBody } = body

    if (!endpoint) {
      return NextResponse.json({ error: "endpoint is required" }, { status: 400 })
    }

    console.log(`🧪 [TEST-API] Testing endpoint: ${endpoint}`, { method, params, requestBody })

    let result: any
    const defaultMicroservice = getMicroserviceCode()

    // Route to appropriate database query (same as actual Radius API endpoints)
    switch (endpoint) {
      case "auth/user-lookup": {
        if (method !== "GET") {
          return NextResponse.json({ error: "Method must be GET" }, { status: 400 })
        }

        const clerkUserId = params?.clerkUserId
        const email = params?.email
        const microserviceCode = params?.microserviceCode || defaultMicroservice

        if (!clerkUserId && !email) {
          return NextResponse.json({ error: "At least one of clerkUserId or email must be provided" }, { status: 400 })
        }

        // Look up user (same query as /api/radius/auth/user-lookup)
        let user = null
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
          result = {
            success: true,
            found: false,
            user: null,
            roles: [],
            permissions: [],
          }
        } else {
          // Get roles
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

          // Get permissions
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

          result = {
            success: true,
            found: true,
            user,
            roles,
            permissions,
          }
        }
        break
      }

      case "permissions": {
        if (method !== "GET") {
          return NextResponse.json({ error: "Method must be GET" }, { status: 400 })
        }
        if (!params?.userId) {
          return NextResponse.json({ error: "userId is required" }, { status: 400 })
        }

        const userId = params.userId
        const microserviceCode = params?.microserviceCode || defaultMicroservice

        // Get user info
        const userResult = await query<any>(
          `SELECT id, email, first_name, last_name, user_type, is_active
           FROM app_users 
           WHERE id = @param0 AND is_active = 1`,
          [userId]
        )

        if (userResult.length === 0) {
          return NextResponse.json({ error: "User not found or inactive" }, { status: 404 })
        }

        const user = userResult[0]

        // Get roles
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

        // Get permissions
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

        const permissionCodes = permissionsResult.map((p: any) => p.permission_code)

        result = {
          success: true,
          userId,
          email: user.email,
          userType: user.user_type,
          microserviceCode,
          roles,
          permissions: permissionsResult,
          permissionCodes,
          roleNames: roles.map((r: any) => r.role_name),
        }
        break
      }

      case "navigation": {
        if (method !== "GET") {
          return NextResponse.json({ error: "Method must be GET" }, { status: 400 })
        }

        const userId = params?.userId
        const microserviceCode = params?.microserviceCode || defaultMicroservice

        // Get user permissions if userId provided
        let userPermissions: string[] = []
        if (userId) {
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
        }

        // Get microservice ID
        const microserviceResult = await query<{ id: string; app_name: string; description: string }>(
          `SELECT id, app_name, description FROM microservice_apps 
           WHERE app_code = @param0 AND is_active = 1`,
          [microserviceCode]
        )

        if (microserviceResult.length === 0) {
          return NextResponse.json({ error: `Microservice '${microserviceCode}' not found` }, { status: 404 })
        }

        const microserviceId = microserviceResult[0].id

        // Get navigation items
        const navigationResult = await query<any>(
          `SELECT 
            ni.id, ni.code, ni.title, ni.url, ni.icon, ni.permission_required,
            ni.category, ni.subcategory, ni.order_index,
            ISNULL(ni.is_collapsible, 0) as is_collapsible,
            ISNULL(ni.item_type, 'domain') as item_type
          FROM navigation_items ni
          WHERE ni.microservice_id = @param0 AND ni.is_active = 1
          ORDER BY ni.is_collapsible, ni.category, ni.order_index, ni.subcategory`,
          [microserviceId]
        )

        // Filter by permissions
        const checkPermission = (item: any): boolean => {
          if (!item.permission_required || item.permission_required.trim() === "") {
            return true
          }
          return userPermissions.some((userPerm) => {
            if (userPerm === item.permission_required) return true
            if (item.permission_required === "admin" && userPerm === "system_admin") return true
            if (item.permission_required === "user_manage" && (userPerm === "manage_users" || userPerm === "system_admin")) return true
            if (item.permission_required === "admin.view" && (userPerm === "system_admin" || userPerm === "manage_users")) return true
            if (item.permission_required === "system_config" && userPerm === "system_admin") return true
            if (item.permission_required === "system_admin_access" && userPerm === "system_admin_access") return true
            return false
          })
        }

        const fixedItems: any[] = []
        const collapsibleItems: any[] = []
        let visibleItemCount = 0
        let filteredItemCount = 0

        navigationResult.forEach((item: any) => {
          if (!checkPermission(item)) {
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

          if (item.is_collapsible === 1 || item.is_collapsible === true) {
            collapsibleItems.push(navItem)
          } else {
            fixedItems.push(navItem)
          }
          visibleItemCount++
        })

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

        const navigation = Object.entries(fixedByCategory).map(([category, items]) => ({
          title: category,
          items: items.sort((a, b) => a.order - b.order),
        }))

        result = {
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
            microservice: {
              code: microserviceCode,
              name: microserviceResult[0].app_name,
              description: microserviceResult[0].description,
            },
            userPermissions,
          },
        }
        break
      }

      case "auth/user-create": {
        // For now, return a message that this should be tested via the actual endpoint
        // We can implement this later if needed
        return NextResponse.json({
          error: "user-create endpoint testing not yet implemented in test page. Use the actual /api/radius/auth/user-create endpoint for testing.",
        }, { status: 501 })
      }

      default:
        return NextResponse.json({ error: `Unknown endpoint: ${endpoint}` }, { status: 400 })
    }

    console.log(`✅ [TEST-API] Endpoint ${endpoint} returned successfully`)

    return NextResponse.json({
      success: true,
      endpoint,
      result,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error(`❌ [TEST-API] Error testing endpoint:`, error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    const errorStack = error instanceof Error ? error.stack : undefined

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        stack: errorStack,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}

