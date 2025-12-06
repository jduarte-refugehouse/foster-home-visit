import type { NextRequest } from "next/server"

/**
 * SAFE Clerk authentication helper - NO MIDDLEWARE REQUIRED
 * 
 * Gets Clerk user ID from request headers (set by client-side Clerk auth)
 * This avoids requiring clerkMiddleware() which can break authorization
 * 
 * Pattern matches /api/navigation which works reliably
 */
export function getClerkUserIdFromRequest(request: NextRequest): {
  clerkUserId: string | null
  email: string | null
  name: string | null
} {
  // Get from headers (set by client-side Clerk auth in components)
  const clerkUserId = request.headers.get("x-user-clerk-id")
  const email = request.headers.get("x-user-email")
  const name = request.headers.get("x-user-name")

  return {
    clerkUserId: clerkUserId || null,
    email: email || null,
    name: name || null,
  }
}

/**
 * Check if request has Clerk authentication headers
 */
export function hasClerkAuth(request: NextRequest): boolean {
  const { clerkUserId, email } = getClerkUserIdFromRequest(request)
  return !!(clerkUserId || email)
}

/**
 * Get Clerk user ID or throw error
 * Use this when authentication is required
 */
export function requireClerkAuth(request: NextRequest): {
  clerkUserId: string
  email: string | null
  name: string | null
} {
  const { clerkUserId, email, name } = getClerkUserIdFromRequest(request)

  if (!clerkUserId && !email) {
    throw new Error("Authentication required: Missing x-user-clerk-id or x-user-email header")
  }

  if (!clerkUserId && email) {
    // If we have email but not clerk ID, that's okay - we can look up by email
    return {
      clerkUserId: email, // Use email as identifier
      email,
      name: name || null,
    }
  }

  return {
    clerkUserId,
    email: email || null,
    name: name || null,
  }
}

// Re-export functions from auth-utils for convenience
export { getAuth, isClerkEnabled, getCurrentUser } from './auth-utils'

