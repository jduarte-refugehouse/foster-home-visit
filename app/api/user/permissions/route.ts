import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { getUserByClerkId } from "@/lib/user-management"

export async function GET() {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await getUserByClerkId(userId)

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const permissions = {
      role: user.role,
      canViewHomes: ["admin", "user", "supervisor"].includes(user.role),
      canEditHomes: ["admin", "supervisor"].includes(user.role),
      canManageUsers: user.role === "admin",
      canViewReports: ["admin", "user", "supervisor"].includes(user.role),
      canManageSystem: user.role === "admin",
    }

    return NextResponse.json(permissions)
  } catch (error) {
    console.error("Error fetching user permissions:", error)
    return NextResponse.json({ error: "Failed to fetch permissions" }, { status: 500 })
  }
}
