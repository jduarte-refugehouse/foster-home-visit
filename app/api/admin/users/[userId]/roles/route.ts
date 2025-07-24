import { type NextRequest, NextResponse } from "next/server"
import { updateUserRoles, hasPermission, getUserByClerkId, CURRENT_MICROSERVICE } from "@/lib/user-management"
import { auth } from "@clerk/nextjs/server"
import { MICROSERVICE_CONFIG } from "@/lib/microservice-config"

export async function PUT(request: NextRequest, { params }: { params: { userId: string } }) {
  const { userId: clerkId } = auth()
  if (!clerkId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Get the actual user performing the action
  const adminUser = await getUserByClerkId(clerkId)
  if (!adminUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 })
  }

  const canManageUsers = await hasPermission(adminUser.id, "user_manage", CURRENT_MICROSERVICE)
  if (!canManageUsers) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    const { userId: targetUserId } = params
    const { roles } = await request.json()

    if (!targetUserId || !Array.isArray(roles)) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
    }

    // Validate that all roles exist in the microservice configuration
    const validRoles = Object.values(MICROSERVICE_CONFIG.roles)
    const invalidRoles = roles.filter((role) => !validRoles.includes(role))

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
    console.error(`Error updating user roles for ${MICROSERVICE_CONFIG.name}:`, error)
    return NextResponse.json({ error: "Failed to update user roles" }, { status: 500 })
  }
}
