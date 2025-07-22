import { type NextRequest, NextResponse } from "next/server"
import { updateUserRoles, CURRENT_MICROSERVICE } from "@/lib/user-management"
import { auth } from "@clerk/nextjs/server"
import { hasPermission } from "@/lib/user-management"

export async function PUT(request: NextRequest, { params }: { params: { userId: string } }) {
  const { userId: clerkId } = auth()
  if (!clerkId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const internalUserId = "user-1" // Admin performing the action
  const canManageUsers = await hasPermission(internalUserId, "user_manage")
  if (!canManageUsers) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    const { userId: targetUserId } = params
    const { roles } = await request.json()

    if (!targetUserId || !Array.isArray(roles)) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
    }

    await updateUserRoles(targetUserId, roles, CURRENT_MICROSERVICE, internalUserId)

    return NextResponse.json({ message: "User roles updated successfully" })
  } catch (error) {
    console.error("Error updating user roles:", error)
    return NextResponse.json({ error: "Failed to update user roles" }, { status: 500 })
  }
}
