import { auth } from "@clerk/nextjs/server"

const isClerkEnabled = !!process.env.CLERK_SECRET_KEY

export async function getAuth() {
  // In dev (v0 preview), return mock auth data
  if (!isClerkEnabled) {
    return {
      userId: "mock-user-id-1234",
      sessionId: "mock-session-id-5678",
      isLoaded: true,
      isSignedIn: true,
    }
  }

  // In production, use real auth from Clerk
  return auth()
}
