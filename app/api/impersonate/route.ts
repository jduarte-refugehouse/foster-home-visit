import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { query } from "@/lib/db"
import { getUserByClerkId } from "@/lib/user-management"
import { checkPermission } from "@/lib/permissions-middleware"

export const runtime = "nodejs"

const IMPERSONATION_COOKIE_NAME = "impersonate_user_id"
const IMPERSONATION_ADMIN_COOKIE_NAME = "impersonate_admin_id"

// POST - Start impersonating a user
export async function POST(request: NextRequest) {
  try {
    const { userId: clerkUserId } = await auth()

    if (!clerkUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if the current user has admin permissions
    const permissionCheck = await checkPermission("system_config", "home-visits")
    if (!permissionCheck.authorized) {
      return NextResponse.json(
        { error: "Insufficient permissions. Only administrators can impersonate users." },
        { status: 403 }
      )
    }

    // Get the admin user
    const adminUser = await getUserByClerkId(clerkUserId)
    if (!adminUser) {
      return NextResponse.json({ error: "Admin user not found" }, { status: 404 })
    }

    // Get the target user ID from request body
    const body = await request.json()
    const targetUserId = body.userId

    if (!targetUserId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    // Verify the target user exists
    const targetUser = await query<{ id: string; email: string; first_name: string; last_name: string; is_active: number }>(
      "SELECT id, email, first_name, last_name, is_active FROM app_users WHERE id = @param0",
      [targetUserId]
    )

    if (targetUser.length === 0) {
      return NextResponse.json({ error: "Target user not found" }, { status: 404 })
    }

    if (!targetUser[0].is_active) {
      return NextResponse.json({ error: "Cannot impersonate inactive user" }, { status: 400 })
    }

    // Can't impersonate yourself
    if (targetUser[0].id === adminUser.id) {
      return NextResponse.json({ error: "Cannot impersonate yourself" }, { status: 400 })
    }

    // Create response with cookies
    const response = NextResponse.json({
      success: true,
      message: "Impersonation started",
      impersonatedUser: {
        id: targetUser[0].id,
        email: targetUser[0].email,
        name: `${targetUser[0].first_name} ${targetUser[0].last_name}`,
      },
      adminUser: {
        id: adminUser.id,
        email: adminUser.email,
        name: `${adminUser.first_name} ${adminUser.last_name}`,
      },
    })

    // Set impersonation cookies (expires in 8 hours, httpOnly for security)
    response.cookies.set(IMPERSONATION_COOKIE_NAME, targetUser[0].id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 8, // 8 hours
      path: "/",
    })

    response.cookies.set(IMPERSONATION_ADMIN_COOKIE_NAME, adminUser.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 8, // 8 hours
      path: "/",
    })

    return response
  } catch (error) {
    console.error("❌ Error starting impersonation:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to start impersonation",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}

// DELETE - Stop impersonating
export async function DELETE(request: NextRequest) {
  try {
    const { userId: clerkUserId } = await auth()

    if (!clerkUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify the user is actually impersonating (check if they're the admin who started it)
    const adminUser = await getUserByClerkId(clerkUserId)
    if (!adminUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Create response
    const response = NextResponse.json({
      success: true,
      message: "Impersonation stopped",
    })

    // Clear impersonation cookies
    response.cookies.delete(IMPERSONATION_COOKIE_NAME)
    response.cookies.delete(IMPERSONATION_ADMIN_COOKIE_NAME)

    return response
  } catch (error) {
    console.error("❌ Error stopping impersonation:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to stop impersonation",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}

// GET - Get current impersonation status
export async function GET(request: NextRequest) {
  try {
    const { userId: clerkUserId } = await auth()

    if (!clerkUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get impersonation cookies
    const impersonatedUserId = request.cookies.get(IMPERSONATION_COOKIE_NAME)?.value
    const adminId = request.cookies.get(IMPERSONATION_ADMIN_COOKIE_NAME)?.value

    if (!impersonatedUserId) {
      return NextResponse.json({
        success: true,
        isImpersonating: false,
      })
    }

    // Get impersonated user details
    const impersonatedUser = await query<{
      id: string
      email: string
      first_name: string
      last_name: string
      is_active: number
    }>("SELECT id, email, first_name, last_name, is_active FROM app_users WHERE id = @param0", [
      impersonatedUserId,
    ])

    // Get admin user details
    const adminUser = adminId
      ? await query<{ id: string; email: string; first_name: string; last_name: string }>(
          "SELECT id, email, first_name, last_name FROM app_users WHERE id = @param0",
          [adminId]
        )
      : null

    return NextResponse.json({
      success: true,
      isImpersonating: true,
      impersonatedUser: impersonatedUser[0]
        ? {
            id: impersonatedUser[0].id,
            email: impersonatedUser[0].email,
            name: `${impersonatedUser[0].first_name} ${impersonatedUser[0].last_name}`,
          }
        : null,
      adminUser: adminUser && adminUser[0] ? {
        id: adminUser[0].id,
        email: adminUser[0].email,
        name: `${adminUser[0].first_name} ${adminUser[0].last_name}`,
      } : null,
    })
  } catch (error) {
    console.error("❌ Error getting impersonation status:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to get impersonation status",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}

