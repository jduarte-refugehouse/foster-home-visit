"use client"

import { useState, useEffect } from "react"

interface MockUser {
  id: string
  firstName: string
  lastName: string
  emailAddresses: Array<{ emailAddress: string }>
  imageUrl: string
}

export function useSafeUser() {
  const [user, setUser] = useState<MockUser | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [isSignedIn, setIsSignedIn] = useState(false)

  useEffect(() => {
    // Mock user for development without Clerk
    const mockUser: MockUser = {
      id: "mock-user-id",
      firstName: "Demo",
      lastName: "User",
      emailAddresses: [{ emailAddress: "demo@example.com" }],
      imageUrl: "/placeholder-user.jpg",
    }

    setUser(mockUser)
    setIsLoaded(true)
    setIsSignedIn(true)
  }, [])

  return {
    user,
    isLoaded,
    isSignedIn,
  }
}
