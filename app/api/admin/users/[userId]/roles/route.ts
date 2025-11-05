import { type NextRequest, NextResponse } from "next/server"
import { updateUserRoles, hasPermission, getUserByClerkId, CURRENT_MICROSERVICE } from "@/lib/user-management"
import { auth, currentUser } from "@clerk/nextjs/server"
import { MICROSERVICE_CONFIG } from "@/lib/microservice-config"

export async function PUT(request: NextRequest, { params }: { params: { userId: string } }) {
  try {
    let clerkUserId
    try {
      // Try currentUser first (more reliable)
      const user = await currentUser()
      if (user?.id) {
        clerkUserId = user.id
      } else {
        // Fallback to auth()
        const authResult = await auth()
        clerkUserId = authResult?.userId
      }
    } catch (authError) {
      console.error("❌ [API] Auth error in user roles PUT:", authError)
      return NextResponse.json({ error: "Authentication failed", details: authError instanceof Error ? authError.message : "Unknown auth error" }, { status: 401 })
    }

    if (!clerkUserId) {
      console.error("❌ [API] No clerkUserId found in user roles PUT")
      return NextResponse.json({ error: "Unauthorized", details: "No user ID from authentication" }, { status: 401 })
    }

    // Get the actual user performing the action
    const adminUser = await getUserByClerkId(clerkUserId)
    if (!adminUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const canManageUsers = await hasPermission(adminUser.id, "user_manage", CURRENT_MICROSERVICE)
    if (!canManageUsers) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    const { userId: targetUserId } = params
    const { roles } = await request.json()

    if (!targetUserId || !Array.isArray(roles)) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
    }

    // Get microservice ID
    const { query } = await import("@/lib/db")
    const microservice = await query<{ id: string }>(
      "SELECT id FROM microservice_apps WHERE app_code = @param0 AND is_active = 1",
      [CURRENT_MICROSERVICE]
    )

    if (microservice.length === 0) {
      return NextResponse.json({ error: "Microservice not found" }, { status: 404 })
    }

    const microserviceId = microservice[0].id

    // Validate that all roles exist in either the database OR the config
    const configRoles = Object.values(MICROSERVICE_CONFIG.roles)
    const dbRoles = await query<{ role_name: string }>(
      "SELECT DISTINCT role_name FROM user_roles WHERE microservice_id = @param0",
      [microserviceId]
    )
    const dbRoleNames = dbRoles.map((r) => r.role_name)
    const allValidRoles = [...new Set([...configRoles, ...dbRoleNames])]

    const invalidRoles = roles.filter((role) => !allValidRoles.includes(role))

    if (invalidRoles.length > 0) {
      return NextResponse.json(
        {
          error: "Invalid roles",
          details: `Invalid roles for ${MICROSERVICE_CONFIG.name}: ${invalidRoles.join(", ")}`,
        },
        { status: 400 },
      )
    }

    await updateUserRoles(targetUserId, roles, CURRENT_MICROSERVICE, adminUser.id)

    return NextResponse.json({
      message: "User roles updated successfully",
      microservice: MICROSERVICE_CONFIG.name,
    })
  } catch (error) {
    console.error(`❌ [API] Error updating user roles for ${MICROSERVICE_CONFIG.name}:`, error)
    console.error("❌ [API] Error details:", {
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    })
    return NextResponse.json(
      {
        error: "Failed to update user roles",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}
