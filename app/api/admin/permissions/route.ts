import { NextResponse } from "next/server"
import { getAllDefinedPermissions, CURRENT_MICROSERVICE } from "@/lib/user-management"
import { auth } from "@clerk/nextjs/server"
import { hasPermission } from "@/lib/user-management"

export const dynamic = "force-dynamic"

export async function GET() {
  const { userId: clerkId } = auth()
  if (!clerkId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const internalUserId = "user-1"
  const canView = await hasPermission(internalUserId, "system_config")
  if (!canView) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    const permissions = await getAllDefinedPermissions(CURRENT_MICROSERVICE)
    return NextResponse.json(permissions)
  } catch (error) {
    console.error("Error fetching permissions:", error)
    return NextResponse.json({ error: "Failed to fetch permissions" }, { status: 500 })
  }
}
