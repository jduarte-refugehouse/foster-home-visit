"use client"

import { useEffect, useState, useRef } from "react"
import { AlertTriangle, X } from "lucide-react"
import { Button } from "@refugehouse/shared-core/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@refugehouse/shared-core/components/ui/alert"

interface ImpersonationStatus {
  isImpersonating: boolean
  impersonatedUser?: {
    id: string
    email: string
    name: string
  }
  adminUser?: {
    id: string
    email: string
    name: string
  }
}

/**
 * PROTOCOL: Does NOT use Clerk hooks after authentication.
 * Gets Clerk ID from session API, then uses headers for API calls.
 */
export function ImpersonationBanner() {
  const [status, setStatus] = useState<ImpersonationStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [sessionUser, setSessionUser] = useState<{ id: string; email: string; name: string } | null>(null)
  const [loadingSession, setLoadingSession] = useState(true)
  const sessionUserRef = useRef<{ id: string; email: string; name: string } | null>(null)

  // Get Clerk ID from session (NO Clerk hooks)
  useEffect(() => {
    const fetchSessionUser = async () => {
      // Check sessionStorage first
      const storedUser = sessionStorage.getItem("session_user")
      if (storedUser) {
        try {
          const parsed = JSON.parse(storedUser)
          if (parsed.clerkUserId) {
            const user = {
              id: parsed.clerkUserId,
              email: parsed.email || "",
              name: parsed.name || "",
            }
            setSessionUser(user)
            sessionUserRef.current = user
            setLoadingSession(false)
            return
          }
        } catch (e) {
          // Invalid stored data, fetch fresh
        }
      }

      // Fetch from API (uses Clerk server-side ONCE)
      try {
        const response = await fetch("/api/auth/get-session-user", {
          method: "GET",
          credentials: "include",
        })

        if (response.ok) {
          const data = await response.json()
          if (data.success && data.clerkUserId) {
            const user = {
              id: data.clerkUserId,
              email: data.email || "",
              name: data.name || "",
            }
            setSessionUser(user)
            sessionUserRef.current = user
            // Store in sessionStorage
            sessionStorage.setItem("session_user", JSON.stringify({
              clerkUserId: data.clerkUserId,
              email: data.email,
              name: data.name,
            }))
          }
        }
        }
      } catch (error) {
        console.error("Error fetching session user:", error)
      } finally {
        setLoadingSession(false)
      }
    }

    fetchSessionUser()
  }, [])

  useEffect(() => {
    if (!loadingSession && sessionUser) {
      fetchImpersonationStatus()
    } else if (!loadingSession && !sessionUser) {
      setLoading(false)
    }
  }, [loadingSession, sessionUser])

  const getAuthHeaders = (): HeadersInit => {
    if (!sessionUser) return {}
    return {
      "x-user-email": sessionUser.email,
      "x-user-clerk-id": sessionUser.id,
      "x-user-name": sessionUser.name,
    }
  }

  const fetchImpersonationStatus = async () => {
    try {
      const response = await fetch("/api/impersonate", {
        headers: getAuthHeaders(),
        credentials: 'include',
      })
      if (response.ok) {
        const data = await response.json()
        setStatus(data)
      }
    } catch (error) {
      console.error("Error fetching impersonation status:", error)
    } finally {
      setLoading(false)
    }
  }

  const stopImpersonation = async () => {
    try {
      const response = await fetch("/api/impersonate", {
        method: "DELETE",
        headers: getAuthHeaders(),
        credentials: 'include',
      })

      if (response.ok) {
        // Reload the page to refresh all data
        window.location.reload()
      } else {
        const data = await response.json()
        alert(data.error || "Failed to stop impersonation")
      }
    } catch (error) {
      console.error("Error stopping impersonation:", error)
      alert("Failed to stop impersonation")
    }
  }

  if (loading || !status?.isImpersonating) {
    return null
  }

  return (
    <Alert className="border-amber-400 bg-amber-50 dark:bg-amber-950/20 rounded-none border-x-0 border-t-0">
      <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
      <AlertTitle className="text-amber-900 dark:text-amber-100 font-semibold">
        Impersonating User
      </AlertTitle>
      <AlertDescription className="text-amber-800 dark:text-amber-200 mt-2">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1">
            <p>
              You are viewing the application as{" "}
              <strong>{status.impersonatedUser?.name || status.impersonatedUser?.email}</strong>
              {status.adminUser && (
                <span className="text-sm">
                  {" "}
                  (Admin: {status.adminUser.name || status.adminUser.email})
                </span>
              )}
            </p>
            <p className="text-xs mt-1 opacity-75">
              All actions and data are shown from this user's perspective
            </p>
          </div>
          <Button
            onClick={stopImpersonation}
            variant="outline"
            size="sm"
            className="border-amber-400 text-amber-900 hover:bg-amber-100 dark:border-amber-600 dark:text-amber-200 dark:hover:bg-amber-900/30"
          >
            <X className="h-4 w-4 mr-2" />
            Stop Impersonating
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  )
}

