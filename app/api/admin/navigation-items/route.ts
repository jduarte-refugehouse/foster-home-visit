import { NextResponse, type NextRequest } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { query } from "@/lib/db"
import { checkPermission } from "@/lib/permissions-middleware"
import { CURRENT_MICROSERVICE } from "@/lib/user-management"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

// GET - Fetch all navigation items for the microservice
export async function GET(request: NextRequest) {
  try {
    let clerkUserId
    try {
      const authResult = await auth()
      clerkUserId = authResult?.userId
    } catch (authError) {
      console.error("❌ [API] Auth error in navigation-items GET:", authError)
      return NextResponse.json({ error: "Authentication failed", details: authError instanceof Error ? authError.message : "Unknown auth error" }, { status: 401 })
    }

    if (!clerkUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check permissions
    try {
      const permissionCheck = await checkPermission("system_config", CURRENT_MICROSERVICE, request)
      if (!permissionCheck.authorized) {
        return NextResponse.json({ error: "Insufficient permissions", reason: permissionCheck.reason }, { status: 403 })
      }
    } catch (permError) {
      console.error("❌ [API] Permission check error:", permError)
      return NextResponse.json({ error: "Permission check failed", details: permError instanceof Error ? permError.message : "Unknown error" }, { status: 500 })
    }

    // Get microservice ID
    const microservice = await query<{ id: string; app_code: string; app_name: string }>(
      "SELECT id, app_code, app_name FROM microservice_apps WHERE app_code = @param0 AND is_active = 1",
      [CURRENT_MICROSERVICE]
    )

    if (microservice.length === 0) {
      console.error(`❌ [API] Microservice not found for code: ${CURRENT_MICROSERVICE}`)
      return NextResponse.json({ error: "Microservice not found" }, { status: 404 })
    }

    const microserviceId = microservice[0].id
    console.log(`🔍 [API] Fetching navigation items for microservice: ${CURRENT_MICROSERVICE} (${microservice[0].app_name}, ID: ${microserviceId})`)

    // Fetch navigation items with permission info
    const navigationItems = await query<{
      id: string
      code: string
      title: string
      url: string
      icon: string
      permission_required: string | null
      permission_code: string | null
      category: string
      order_index: number
      is_active: number
      created_at: string
      updated_at: string
    }>(
      `
      SELECT 
        ni.id,
        ni.code,
        ni.title,
        ni.url,
        ni.icon,
        ni.permission_required,
        p.permission_code,
        ni.category,
        ni.order_index,
        ni.is_active,
        ni.created_at,
        ni.updated_at
      FROM navigation_items ni
      LEFT JOIN permissions p ON ni.permission_required = p.permission_code AND p.microservice_id = ni.microservice_id
      WHERE ni.microservice_id = @param0
      ORDER BY ni.category, ni.order_index
    `,
      [microserviceId]
    )

    console.log(`✅ [API] Found ${navigationItems.length} navigation items for microservice ${CURRENT_MICROSERVICE}`)
    if (navigationItems.length > 0) {
      console.log(`📋 [API] Navigation item codes:`, navigationItems.map(ni => ni.code))
      console.log(`📋 [API] Sample item:`, JSON.stringify(navigationItems[0], null, 2))
    } else {
      // Debug: Check if there are any navigation items at all for this microservice
      const allItems = await query<{ id: string; code: string; microservice_id: string }>(
        "SELECT id, code, microservice_id FROM navigation_items WHERE microservice_id = @param0",
        [microserviceId]
      )
      console.log(`🔍 [API] Debug: Found ${allItems.length} items with microservice_id ${microserviceId} (before join)`)
      if (allItems.length > 0) {
        console.log(`📋 [API] Debug: Sample item microservice_id:`, allItems[0].microservice_id)
      }
    }

    return NextResponse.json({
      success: true,
      navigationItems: navigationItems.map((item) => ({
        id: item.id,
        code: item.code,
        title: item.title,
        url: item.url,
        icon: item.icon,
        permissionRequired: item.permission_code,
        permissionId: item.permission_required,
        category: item.category,
        orderIndex: item.order_index,
        isActive: item.is_active === 1,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
      })),
    })
  } catch (error) {
    console.error("❌ [API] Error fetching navigation items:", error)
    console.error("❌ [API] Error details:", {
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined,
    })
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch navigation items",
        details: error instanceof Error ? error.message : "Unknown error",
        errorType: error instanceof Error ? error.name : "Unknown",
        stack: process.env.NODE_ENV === "development" ? (error instanceof Error ? error.stack : undefined) : undefined,
      },
      { status: 500 }
    )
  }
}

// POST - Create new navigation item
export async function POST(request: NextRequest) {
  try {
    let clerkUserId
    try {
      const authResult = await auth()
      clerkUserId = authResult?.userId
    } catch (authError) {
      console.error("❌ [API] Auth error in navigation-items POST:", authError)
      return NextResponse.json({ error: "Authentication failed", details: authError instanceof Error ? authError.message : "Unknown auth error" }, { status: 401 })
    }

    if (!clerkUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check permissions
    try {
      const permissionCheck = await checkPermission("system_config", CURRENT_MICROSERVICE, request)
      if (!permissionCheck.authorized) {
        return NextResponse.json({ error: "Insufficient permissions", reason: permissionCheck.reason }, { status: 403 })
      }
    } catch (permError) {
      console.error("❌ [API] Permission check error:", permError)
      return NextResponse.json({ error: "Permission check failed", details: permError instanceof Error ? permError.message : "Unknown error" }, { status: 500 })
    }

    const body = await request.json()
    const { code, title, url, icon, permissionRequired, category, orderIndex } = body

    if (!code || !title || !url || !icon || !category) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Get microservice ID
    const microservice = await query<{ id: string }>(
      "SELECT id FROM microservice_apps WHERE app_code = @param0 AND is_active = 1",
      [CURRENT_MICROSERVICE]
    )

    if (microservice.length === 0) {
      return NextResponse.json({ error: "Microservice not found" }, { status: 404 })
    }

    const microserviceId = microservice[0].id

    // Get permission ID if permission code provided
    let permissionId: string | null = null
    if (permissionRequired) {
      const permission = await query<{ id: string }>(
        "SELECT id FROM permissions WHERE permission_code = @param0 AND microservice_id = @param1",
        [permissionRequired, microserviceId]
      )
      if (permission.length > 0) {
        permissionId = permission[0].id
      }
    }

    // Check if code already exists
    const existing = await query<{ id: string }>(
      "SELECT id FROM navigation_items WHERE code = @param0 AND microservice_id = @param1",
      [code, microserviceId]
    )

    if (existing.length > 0) {
      return NextResponse.json({ error: "Navigation item with this code already exists" }, { status: 400 })
    }

    // Insert new navigation item
    const result = await query<{ id: string }>(
      `
      INSERT INTO navigation_items (
        id,
        microservice_id,
        code,
        title,
        url,
        icon,
        permission_required,
        category,
        order_index,
        is_active,
        created_at,
        updated_at
      )
      OUTPUT INSERTED.id
      VALUES (
        NEWID(),
        @param0,
        @param1,
        @param2,
        @param3,
        @param4,
        @param5,
        @param6,
        @param7,
        1,
        GETDATE(),
        GETDATE()
      )
    `,
      [
        microserviceId,
        code,
        title,
        url,
        icon,
        permissionId,
        category,
        orderIndex || 0,
      ]
    )

    return NextResponse.json({
      success: true,
      navigationItem: {
        id: result[0].id,
        code,
        title,
        url,
        icon,
        permissionRequired,
        category,
        orderIndex: orderIndex || 0,
        isActive: true,
      },
    })
  } catch (error) {
    console.error("❌ [API] Error creating navigation item:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create navigation item",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}

