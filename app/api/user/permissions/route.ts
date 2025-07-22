import { type NextRequest, NextResponse } from "next/server"
import { headers } from "next/headers"
import { auth } from "@clerk/nextjs/server"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const headersList = await headers()
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // For now, return basic permissions
    // In a real app, you'd fetch these from your database
    const permissions = {
      canViewHomes: true,
      canEditHomes: true,
      canViewAdmin: userId === "admin", // Simple admin check
      canManageUsers: userId === "admin",
      canViewReports: true,
    }

    return NextResponse.json({ permissions })
  } catch (error) {
    console.error("Error fetching user permissions:", error)
    return NextResponse.json({ error: "Failed to fetch permissions" }, { status: 500 })
  }
}
