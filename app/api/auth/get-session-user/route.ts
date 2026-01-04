import { type NextRequest, NextResponse } from "next/server"
import { currentUser } from "@clerk/nextjs/server"

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
    // Read user from Clerk session cookie (server-side, secure)
    // This is the ONLY use of Clerk APIs after authentication
    const user = await currentUser()
    
    if (!user) {
      return NextResponse.json(
        {
          error: "Not authenticated",
          details: "No active session found. Please sign in.",
        },
        { status: 401 }
      )
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

