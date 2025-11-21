import { type NextRequest, NextResponse } from "next/server"
import { currentUser, auth } from "@clerk/nextjs/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * GET - Get current user ID from authenticated Clerk session
 * 
 * This endpoint reads the user ID from the Clerk session cookie (server-side).
 * It's the ONLY place we use Clerk APIs after authentication - just to get the user ID.
 * After this, the app never uses Clerk APIs again.
 * 
 * Returns: { clerkUserId: string, email: string | null, name: string | null }
 */
export async function GET(request: NextRequest) {
  try {
    // First, check if there's an active session using auth()
    // This is more lightweight and helps us distinguish between "no session" and "Clerk error"
    let authData
    try {
      authData = await auth()
    } catch (authError) {
      console.error("❌ [AUTH] Error checking auth:", authError)
      // If auth() fails, it might be a configuration issue
      // Return 401 to indicate authentication is required, not a server error
      return NextResponse.json(
        {
          error: "Not authenticated",
          details: "Unable to verify authentication. Please sign in.",
        },
        { status: 401 }
      )
    }

    // If no session, return 401 (not authenticated)
    if (!authData || !authData.userId) {
      return NextResponse.json(
        {
          error: "Not authenticated",
          details: "No active session found. Please sign in.",
        },
        { status: 401 }
      )
    }

    // Now get full user details
    // Read user from Clerk session cookie (server-side, secure)
    // This is the ONLY use of Clerk APIs after authentication
    let user
    try {
      user = await currentUser()
    } catch (userError) {
      console.error("❌ [AUTH] Error getting current user:", userError)
      // If currentUser() fails but auth() succeeded, we can still return basic info
      // This provides a fallback if currentUser() has issues
      return NextResponse.json({
        success: true,
        clerkUserId: authData.userId,
        email: null,
        name: null,
        warning: "Limited user data available",
      })
    }
    
    if (!user) {
      // Fallback: use auth data if currentUser() returns null
      return NextResponse.json({
        success: true,
        clerkUserId: authData.userId,
        email: null,
        name: null,
        warning: "Limited user data available",
      })
    }

    // Return user ID from originally authenticated session
    // This will be stored client-side and sent in headers for all API calls
    return NextResponse.json({
      success: true,
      clerkUserId: user.id,
      email: user.emailAddresses[0]?.emailAddress || null,
      name: `${user.firstName || ""} ${user.lastName || ""}`.trim() || null,
    })
  } catch (error) {
    // Catch-all for any unexpected errors
    console.error("❌ [AUTH] Unexpected error getting session user:", error)
    console.error("❌ [AUTH] Error stack:", error instanceof Error ? error.stack : "No stack trace")
    console.error("❌ [AUTH] Error details:", {
      message: error instanceof Error ? error.message : "Unknown error",
      type: error?.constructor?.name,
    })
    
    // Return 401 instead of 500 for authentication-related errors
    // This prevents infinite loops and allows the app to handle "not authenticated" gracefully
    return NextResponse.json(
      {
        error: "Not authenticated",
        details: error instanceof Error ? error.message : "Unable to verify authentication. Please sign in.",
      },
      { status: 401 }
    )
  }
}

