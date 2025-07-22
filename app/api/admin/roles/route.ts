import { NextResponse } from "next/server"
import { getAllDefinedRoles, CURRENT_MICROSERVICE } from "@/lib/user-management"
import { auth } from "@clerk/nextjs/server"
import { hasPermission } from "@/lib/user-management"

export const dynamic = "force-dynamic"

export async function GET() {
  const { userId: clerkId } = auth()
  if (!clerkId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // This is a placeholder for getting our internal app_user id.
  // In a real scenario, you'd look this up. For now, we assume admin.
  const internalUserId = "user-1" // Assuming jduarte is the admin

  const canView = await hasPermission(internalUserId, "system_config")
  if (!canView) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    const roles = await getAllDefinedRoles(CURRENT_MICROSERVICE)
    return NextResponse.json(roles)
  } catch (error) {
    console.error("Error fetching roles:", error)
    return NextResponse.json({ error: "Failed to fetch roles" }, { status: 500 })
  }
}
