import { auth, currentUser } from "@clerk/nextjs/server"

/**
 * @deprecated This function uses Clerk APIs (auth()) which violates our authentication methodology.
 * DO NOT USE - Clerk should only be used ONCE for initial authentication.
 * After that, use stored credentials from headers and database lookups only.
 * 
 * Use requireClerkAuth(request) or getClerkUserIdFromRequest(request) instead.
 */
export async function getAuth() {
  try {
    // Get real Clerk auth data
    const authData = await auth()
    return {
      userId: authData.userId,
      sessionId: authData.sessionId,
      isLoaded: true,
      isSignedIn: !!authData.userId,
    }
  } catch (error) {
    console.error("Error getting auth data:", error)
    // Fallback to mock data only if Clerk fails
    return {
      userId: "mock-user-id-1234",
      sessionId: "mock-session-id-5678",
      isLoaded: true,
      isSignedIn: true,
    }
  }
}

// Helper function to check if we're in a Clerk-enabled environment
export function isClerkEnabled(): boolean {
  return true // Enable Clerk
}

/**
 * @deprecated This function uses Clerk APIs (currentUser()) which violates our authentication methodology.
 * DO NOT USE - Clerk should only be used ONCE for initial authentication.
 * After that, use stored credentials from headers and database lookups only.
 * 
 * Use requireClerkAuth(request) or getClerkUserIdFromRequest(request) instead.
 */
export async function getCurrentUser() {
  try {
    const user = await currentUser()
    return user
  } catch (error) {
    console.error("Error getting current user:", error)
    // Fallback to mock data only if Clerk fails
    return {
      id: "mock-user-id-1234",
      emailAddresses: [{ emailAddress: "mock-user@example.com" }],
      firstName: "Mock",
      lastName: "User",
    }
  }
}
