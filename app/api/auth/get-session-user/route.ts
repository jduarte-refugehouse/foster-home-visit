import { type NextRequest, NextResponse } from "next/server"
import { getAuth } from "@clerk/backend"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * GET - Get current user ID from authenticated Clerk session
 * 
 * This endpoint reads the user ID from the Clerk session cookie (server-side).
 * It's the ONLY place we use Clerk APIs after authentication - just to get the user ID.
 * After this, the app never uses Clerk APIs again.
 * 
 * Uses getAuth() from @clerk/backend which works without middleware.
 * 
 * Returns: { clerkUserId: string, email: string | null, name: string | null }
 */
export async function GET(request: NextRequest) {
  try {
    // Read user from Clerk session cookie (server-side, secure)
    // This is the ONLY use of Clerk APIs after authentication
    // Using getAuth() from @clerk/backend which doesn't require middleware
    const authResult = await getAuth(request)
    
    if (!authResult.userId) {
      return NextResponse.json(
        {
          error: "Not authenticated",
          details: "No active session found. Please sign in.",
        },
        { status: 401 }
      )
    }

    // Note: getAuth() only returns userId, not full user object
    // The client should already have user info from Clerk client-side
    // This endpoint just confirms the session is valid
    return NextResponse.json({
      success: true,
      clerkUserId: authResult.userId,
      email: null, // Client should provide this in headers
      name: null,  // Client should provide this in headers
    })
  } catch (error) {
    console.error("❌ [AUTH] Error getting session user:", error)
    console.error("❌ [AUTH] Error stack:", error instanceof Error ? error.stack : "No stack trace")
    console.error("❌ [AUTH] Error details:", JSON.stringify(error, Object.getOwnPropertyNames(error)))
    return NextResponse.json(
      {
        error: "Failed to get user from session",
        details: error instanceof Error ? error.message : "Unknown error",
        type: error instanceof Error ? error.constructor.name : typeof error,
      },
      { status: 500 }
    )
  }
}

