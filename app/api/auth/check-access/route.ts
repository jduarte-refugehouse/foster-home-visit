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
    // Get Clerk user info from headers OR session cookies
    // This allows mobile to work where headers might not be sent
    let clerkUserId: string | null = null
    let email: string | null = null
    let name: string | null = null

    // Try headers first (desktop/tablet)
    try {
      const auth = requireClerkAuth(request)
      clerkUserId = auth.clerkUserId
      email = auth.email
      name = auth.name
    } catch (authError) {
      // Headers not available - try session cookie (mobile)
      // Import currentUser to read from session cookie
      const { currentUser } = await import("@clerk/nextjs/server")
      try {
        const user = await currentUser()
        if (user) {
          clerkUserId = user.id
          email = user.emailAddresses[0]?.emailAddress || null
          name = `${user.firstName || ""} ${user.lastName || ""}`.trim() || null
        }
      } catch (sessionError) {
        // No session either - user is not authenticated
        return NextResponse.json(
          {
            error: "Unauthorized",
            details: "Not authenticated. Please sign in.",
          },
          { status: 401 },
        )
      }
    }

    if (!clerkUserId || !email) {
      return NextResponse.json(
        {
          error: "Unauthorized",
          details: "Unable to determine authenticated user.",
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

