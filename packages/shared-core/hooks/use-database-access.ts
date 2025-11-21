"use client"

import { useState, useEffect, useRef } from "react"

interface DatabaseAccessResult {
  hasAccess: boolean
  userInfo: any | null
  isLoading: boolean
  error: string | null
}

/**
 * SECURITY: Hook to check if user is authenticated AND found in database.
 * 
 * PROTOCOL: Does NOT use Clerk hooks after authentication. Instead:
 * 1. Gets Clerk ID from session API (server-side, one-time use of Clerk)
 * 2. Stores in sessionStorage for reuse
 * 3. Uses headers (x-user-clerk-id, x-user-email) to check database access
 * 4. Never uses Clerk hooks/APIs after initial authentication
 * 
 * This should be used by all protected pages to ensure users have database-level permissions
 * before showing any protected content.
 * 
 * Returns:
 * - hasAccess: true if user is found in database, false otherwise
 * - userInfo: user record from database if found, null otherwise
 * - isLoading: true while checking access
 * - error: error message if check fails
 */
export function useDatabaseAccess(): DatabaseAccessResult {
  const [hasAccess, setHasAccess] = useState(false)
  const [userInfo, setUserInfo] = useState<any | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const userRef = useRef<{ id: string; email: string; name: string } | null>(null)

  useEffect(() => {
    const checkDatabaseAccess = async () => {
      setIsLoading(true)
      setError(null)

      try {
        // Step 1: Get Clerk ID from session (if not already stored)
        if (!userRef.current) {
          // Check sessionStorage first
          const storedUser = sessionStorage.getItem("session_user")
          if (storedUser) {
            try {
              const parsed = JSON.parse(storedUser)
              if (parsed.clerkUserId) {
                userRef.current = {
                  id: parsed.clerkUserId,
                  email: parsed.email || "",
                  name: parsed.name || "",
                }
              }
            } catch (e) {
              // Invalid stored data, fetch fresh
            }
          }

          // If not in sessionStorage, fetch from API (uses Clerk server-side ONCE)
          if (!userRef.current) {
            const sessionResponse = await fetch("/api/auth/get-session-user", {
              method: "GET",
              credentials: "include",
            })

            if (!sessionResponse.ok) {
              setIsLoading(false)
              setHasAccess(false)
              setUserInfo(null)
              setError("Not authenticated")
              return
            }

            const sessionData = await sessionResponse.json()
            if (sessionData.success && sessionData.clerkUserId) {
              userRef.current = {
                id: sessionData.clerkUserId,
                email: sessionData.email || "",
                name: sessionData.name || "",
              }
              // Store in sessionStorage for future use
              sessionStorage.setItem("session_user", JSON.stringify({
                clerkUserId: sessionData.clerkUserId,
                email: sessionData.email,
                name: sessionData.name,
              }))
            } else {
              setIsLoading(false)
              setHasAccess(false)
              setUserInfo(null)
              setError("Not authenticated")
              return
            }
          }
        }

        // Step 2: Use stored Clerk ID to check database access (NO Clerk hooks/APIs)
        if (!userRef.current) {
          setIsLoading(false)
          setHasAccess(false)
          setUserInfo(null)
          return
        }

        const headers: HeadersInit = {
          "x-user-email": userRef.current.email,
          "x-user-clerk-id": userRef.current.id,
          "x-user-name": userRef.current.name,
        }

        // Check navigation API to see if user is found in database
        const response = await fetch("/api/navigation", {
          headers,
          credentials: "include",
        })

        const data = await response.json()
        const found = data.metadata?.userInfo !== null && data.metadata?.userInfo !== undefined
        setHasAccess(found)
        setUserInfo(data.metadata?.userInfo || null)
      } catch (err) {
        console.error("Error checking database access:", err)
        setError(err instanceof Error ? err.message : "Failed to check database access")
        // Fail securely - assume no access on error
        setHasAccess(false)
        setUserInfo(null)
      } finally {
        setIsLoading(false)
      }
    }

    checkDatabaseAccess()
  }, []) // Empty deps - only run once on mount

  return { hasAccess, userInfo, isLoading, error }
}

