import { NextResponse, type NextRequest } from "next/server"
import { query } from "@refugehouse/shared-core/db"
import { checkPermission } from "@refugehouse/shared-core/permissions"
import { CURRENT_MICROSERVICE } from "@refugehouse/shared-core/user-management"
import { requireClerkAuth } from "@refugehouse/shared-core/auth"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

// PATCH - Update navigation item
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // SAFE: Get Clerk user ID from headers (no middleware required)
    let clerkUserId: string
    try {
      const auth = requireClerkAuth(request)
      clerkUserId = auth.clerkUserId
    } catch (authError) {
      console.error("❌ [API] Auth error in navigation-items PATCH:", authError)
      return NextResponse.json({ 
        error: "Authentication failed", 
        details: authError instanceof Error ? authError.message : "Missing authentication headers" 
      }, { status: 401 })
    }

    // Check permissions - use system_admin or view_diagnostics (system_config doesn't exist in DB)
    try {
      const permissionCheck = await checkPermission(["system_admin", "view_diagnostics"], CURRENT_MICROSERVICE, request)
      if (!permissionCheck.authorized) {
        console.log(`⚠️ [API] Permission check failed: ${permissionCheck.reason}`)
        return NextResponse.json({ error: "Insufficient permissions", reason: permissionCheck.reason }, { status: 403 })
      }
    } catch (permError) {
      console.error("❌ [API] Permission check error:", permError)
      return NextResponse.json({ error: "Permission check failed", details: permError instanceof Error ? permError.message : "Unknown error" }, { status: 500 })
    }

    const body = await request.json()
    const { title, url, icon, permissionRequired, category, orderIndex, isActive } = body

    // Get permission ID if permission code provided
    let permissionId: string | null = null
    if (permissionRequired) {
      const microservice = await query<{ id: string }>(
        "SELECT id FROM microservice_apps WHERE app_code = @param0 AND is_active = 1",
        [CURRENT_MICROSERVICE]
      )
      if (microservice.length > 0) {
        const permission = await query<{ id: string }>(
          "SELECT id FROM permissions WHERE permission_code = @param0 AND microservice_id = @param1",
          [permissionRequired, microservice[0].id]
        )
        if (permission.length > 0) {
          permissionId = permission[0].id
        }
      }
    }

    // Build update query dynamically
    const updates: string[] = []
    const params: any[] = []
    let paramIndex = 0

    if (title !== undefined) {
      updates.push(`title = @param${paramIndex}`)
      params.push(title)
      paramIndex++
    }
    if (url !== undefined) {
      updates.push(`url = @param${paramIndex}`)
      params.push(url)
      paramIndex++
    }
    if (icon !== undefined) {
      updates.push(`icon = @param${paramIndex}`)
      params.push(icon)
      paramIndex++
    }
    if (permissionRequired !== undefined) {
      updates.push(`permission_required = @param${paramIndex}`)
      params.push(permissionId)
      paramIndex++
    }
    if (category !== undefined) {
      updates.push(`category = @param${paramIndex}`)
      params.push(category)
      paramIndex++
    }
    if (orderIndex !== undefined) {
      updates.push(`order_index = @param${paramIndex}`)
      params.push(orderIndex)
      paramIndex++
    }
    if (isActive !== undefined) {
      updates.push(`is_active = @param${paramIndex}`)
      params.push(isActive ? 1 : 0)
      paramIndex++
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 })
    }

    updates.push(`updated_at = GETDATE()`)
    const whereParamIndex = paramIndex
    params.push(params.id)

    const updateQuery = `
      UPDATE navigation_items
      SET ${updates.join(", ")}
      WHERE id = @param${whereParamIndex}
    `

    await query(updateQuery, params)

    return NextResponse.json({
      success: true,
      message: "Navigation item updated successfully",
    })
  } catch (error) {
    console.error("❌ [API] Error updating navigation item:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update navigation item",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}

// DELETE - Delete navigation item (soft delete by setting is_active = 0)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // SAFE: Get Clerk user ID from headers (no middleware required)
    let clerkUserId: string
    try {
      const auth = requireClerkAuth(request)
      clerkUserId = auth.clerkUserId
    } catch (authError) {
      console.error("❌ [API] Auth error in navigation-items DELETE:", authError)
      return NextResponse.json({ 
        error: "Authentication failed", 
        details: authError instanceof Error ? authError.message : "Missing authentication headers" 
      }, { status: 401 })
    }

    // Check permissions - use system_admin or view_diagnostics (system_config doesn't exist in DB)
    try {
      const permissionCheck = await checkPermission(["system_admin", "view_diagnostics"], CURRENT_MICROSERVICE, request)
      if (!permissionCheck.authorized) {
        console.log(`⚠️ [API] Permission check failed: ${permissionCheck.reason}`)
        return NextResponse.json({ error: "Insufficient permissions", reason: permissionCheck.reason }, { status: 403 })
      }
    } catch (permError) {
      console.error("❌ [API] Permission check error:", permError)
      return NextResponse.json({ error: "Permission check failed", details: permError instanceof Error ? permError.message : "Unknown error" }, { status: 500 })
    }

    // Soft delete by setting is_active = 0
    await query(
      "UPDATE navigation_items SET is_active = 0, updated_at = GETDATE() WHERE id = @param0",
      [params.id]
    )

    return NextResponse.json({
      success: true,
      message: "Navigation item deactivated successfully",
    })
  } catch (error) {
    console.error("❌ [API] Error deleting navigation item:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete navigation item",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}

