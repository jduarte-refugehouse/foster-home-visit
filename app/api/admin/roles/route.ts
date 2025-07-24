import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { getAllDefinedRoles, hasPermission, CURRENT_MICROSERVICE } from "@/lib/user-management"
import { MICROSERVICE_CONFIG } from "@/lib/microservice-config"

export async function GET(request: NextRequest) {
  const { userId: clerkId } = auth()
  if (!clerkId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const internalUserId = "user-1" // Admin performing the action
  const canManageRoles = await hasPermission(internalUserId, "role_manage")
  if (!canManageRoles) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    const roles = await getAllDefinedRoles(CURRENT_MICROSERVICE)

    return NextResponse.json({
      roles,
      microservice: {
        code: MICROSERVICE_CONFIG.code,
        name: MICROSERVICE_CONFIG.name,
      },
    })
  } catch (error) {
    console.error(`Error fetching roles for ${MICROSERVICE_CONFIG.name}:`, error)
    return NextResponse.json({ error: "Failed to fetch roles" }, { status: 500 })
  }
}
