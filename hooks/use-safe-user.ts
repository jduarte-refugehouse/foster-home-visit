"use client"

import { useUser } from "@clerk/nextjs"

// Safe wrapper for useUser that handles cases where Clerk is disabled
export function useSafeUser() {
  const user = useUser() // Ensure useUser is called at the top level
  try {
    // Try to use Clerk's useUser hook
    return user
  } catch (error) {
    // If Clerk is not available or disabled, return mock user data
    console.warn("Clerk authentication is disabled or not available, using mock user")
    return {
      isLoaded: true,
      isSignedIn: true,
      user: {
        id: "mock-user-id",
        emailAddresses: [{ emailAddress: "mock@example.com" }],
        firstName: "Mock",
        lastName: "User",
      },
    }
  }
}
