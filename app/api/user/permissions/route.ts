import { type NextRequest, NextResponse } from "next/server"
import { headers } from "next/headers"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const headersList = await headers()

    // For now, simulate different user types based on a header or query param
    // This allows you to test the permission system without Clerk
    const testUser = request.nextUrl.searchParams.get("test_user") || "admin"

    let permissions: string[] = []
    let roles: string[] = []
    let userEmail: string | null = null

    switch (testUser) {
      case "admin":
        permissions = ["view_homes", "edit_homes", "manage_users", "view_reports"]
        roles = ["admin"]
        userEmail = "jduarte@refugehouse.org"
        break

      case "staff":
        permissions = ["view_homes"]
        roles = ["staff"]
        userEmail = "staff@refugehouse.org"
        break

      case "external":
        permissions = []
        roles = ["external"]
        userEmail = "external@example.com"
        break

      case "no_permissions":
        permissions = []
        roles = []
        userEmail = "noaccess@example.com"
        break

      default:
        permissions = ["view_homes", "edit_homes", "manage_users", "view_reports"]
        roles = ["admin"]
        userEmail = "jduarte@refugehouse.org"
    }

    return NextResponse.json({
      permissions,
      roles,
      userEmail,
      testMode: true,
    })
  } catch (error) {
    console.error("Error fetching user permissions:", error)
    return NextResponse.json({ error: "Failed to fetch permissions" }, { status: 500 })
  }
}
