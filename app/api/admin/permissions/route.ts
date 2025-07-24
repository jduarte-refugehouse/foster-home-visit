import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { getAllDefinedPermissions, hasPermission, CURRENT_MICROSERVICE } from "@/lib/user-management"
import { MICROSERVICE_CONFIG } from "@/lib/microservice-config"

export async function GET(request: NextRequest) {
  const { userId: clerkId } = auth()
  if (!clerkId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const internalUserId = "user-1" // Admin performing the action
  const canManagePermissions = await hasPermission(internalUserId, "permission_manage")
  if (!canManagePermissions) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    const permissions = await getAllDefinedPermissions(CURRENT_MICROSERVICE)

    return NextResponse.json({
      permissions,
      microservice: {
        code: MICROSERVICE_CONFIG.code,
        name: MICROSERVICE_CONFIG.name,
      },
    })
  } catch (error) {
    console.error(`Error fetching permissions for ${MICROSERVICE_CONFIG.name}:`, error)
    return NextResponse.json({ error: "Failed to fetch permissions" }, { status: 500 })
  }
}
