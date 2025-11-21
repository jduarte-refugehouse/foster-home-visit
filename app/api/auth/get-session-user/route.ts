import { type NextRequest, NextResponse } from "next/server"
import { createClerkClient } from "@clerk/backend"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * GET - Get current user ID from authenticated Clerk session
 * 
 * This endpoint reads the user ID from the Clerk session cookie (server-side).
 * Uses @clerk/backend directly to read cookies without requiring middleware.
 * It's the ONLY place we use Clerk APIs after authentication - just to get the user ID.
 * After this, the app never uses Clerk APIs again.
 * 
 * Returns: { clerkUserId: string, email: string | null, name: string | null }
 */
export async function GET(request: NextRequest) {
  try {
    // Use @clerk/backend directly to read session cookies (no middleware required)
    const clerkClient = createClerkClient({
      secretKey: process.env.CLERK_SECRET_KEY,
    })

    // Authenticate the request using @clerk/backend
    // This reads cookies and verifies the session without requiring middleware
    const authState = await clerkClient.authenticateRequest({
      headers: Object.fromEntries(request.headers.entries()),
      cookies: Object.fromEntries(
        request.cookies.getAll().map(cookie => [cookie.name, cookie.value])
      ),
    })

    if (authState.status === "signed-in" && authState.toAuth().userId) {
      const userId = authState.toAuth().userId
      
      // Get user details
      const user = await clerkClient.users.getUser(userId)

      return NextResponse.json({
        success: true,
        clerkUserId: user.id,
        email: user.emailAddresses[0]?.emailAddress || null,
        name: `${user.firstName || ""} ${user.lastName || ""}`.trim() || null,
      })
    } else {
      // Not authenticated
      return NextResponse.json(
        {
          error: "Not authenticated",
          details: "No active session found. Please sign in.",
        },
        { status: 401 }
      )
    }
  } catch (error) {
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

