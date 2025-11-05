import { type NextRequest, NextResponse } from "next/server"
import { checkUserAccess } from "@/lib/user-access-check"
import { requireClerkAuth } from "@/lib/clerk-auth-helper"

/**
 * Check if the current user has access to the platform
 * - refugehouse.org users: always allowed
 * - External users: must have app_user record OR invitation
 * 
 * Sends email notification to jduarte@refugehouse.org if new user without access tries to log in
 */
export async function GET(request: NextRequest) {
  try {
    // Get Clerk user info from headers
    let clerkUserId: string
    let email: string | null
    let name: string | null

    try {
      const auth = requireClerkAuth(request)
      clerkUserId = auth.clerkUserId
      email = auth.email
      name = auth.name
    } catch (authError) {
      return NextResponse.json(
        {
          error: "Unauthorized",
          details: authError instanceof Error ? authError.message : "Missing authentication headers",
        },
        { status: 401 },
      )
    }

    if (!email) {
      return NextResponse.json({ error: "Email address required" }, { status: 400 })
    }

    // Check user access
    const accessCheck = await checkUserAccess(
      clerkUserId,
      email,
      name?.split(" ")[0] || undefined,
      name?.split(" ").slice(1).join(" ") || undefined,
    )

    if (!accessCheck.hasAccess) {
      return NextResponse.json(
        {
          error: "Access denied. External users require an invitation to join.",
          requiresInvitation: true,
          isNewUser: accessCheck.isNewUser,
        },
        { status: 403 },
      )
    }

    return NextResponse.json({
      success: true,
      hasAccess: true,
      userExists: accessCheck.userExists,
      hasInvitation: accessCheck.hasInvitation,
      isNewUser: accessCheck.isNewUser,
    })
  } catch (error) {
    console.error("❌ [AUTH] Error checking user access:", error)
    return NextResponse.json(
      {
        error: "Failed to check user access",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

