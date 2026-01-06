"use client"

import { useState, useEffect } from "react"
import { useUser } from "@clerk/nextjs"

interface DatabaseAccessResult {
  hasAccess: boolean
  userInfo: any | null
  isLoading: boolean
  error: string | null
}

/**
 * SECURITY: Hook to check if user is authenticated AND found in database.
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
  const { user, isLoaded } = useUser()
  const [hasAccess, setHasAccess] = useState(false)
  const [userInfo, setUserInfo] = useState<any | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const checkDatabaseAccess = async () => {
      setIsLoading(true)
      setError(null)

      try {
        // Wait for Clerk to load
        if (!isLoaded) {
          return
        }

        // If not authenticated, no access
        if (!user) {
          setIsLoading(false)
          setHasAccess(false)
          setUserInfo(null)
          setError("Not authenticated")
          return
        }

        // Use Clerk user to check database access
        const headers: HeadersInit = {
          "x-user-email": user.emailAddresses[0]?.emailAddress || "",
          "x-user-clerk-id": user.id,
          "x-user-name": `${user.firstName || ""} ${user.lastName || ""}`.trim(),
        }

        // Check navigation API to see if user is found in database
        // Add timeout to prevent hanging forever
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout
        
        try {
          const response = await fetch("/api/navigation", {
            headers,
            credentials: "include",
            signal: controller.signal,
          })

          clearTimeout(timeoutId)

          if (!response.ok) {
            throw new Error(`Navigation API returned ${response.status}: ${response.statusText}`)
          }

          const data = await response.json()
          const found = data.metadata?.userInfo !== null && data.metadata?.userInfo !== undefined
          setHasAccess(found)
          setUserInfo(data.metadata?.userInfo || null)
        } catch (fetchError: any) {
          clearTimeout(timeoutId)
          if (fetchError.name === 'AbortError') {
            throw new Error("Navigation API request timed out after 30 seconds")
          }
          throw fetchError
        }
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
  }, [isLoaded, user])

  return { hasAccess, userInfo, isLoading, error }
}

