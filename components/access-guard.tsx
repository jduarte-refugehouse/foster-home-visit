"use client"

import { useEffect, useState } from "react"
import { useUser } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, Shield } from "lucide-react"

interface AccessGuardProps {
  children: React.ReactNode
}

export function AccessGuard({ children }: AccessGuardProps) {
  const { user, isLoaded } = useUser()
  const router = useRouter()
  const [accessChecked, setAccessChecked] = useState(false)
  const [hasAccess, setHasAccess] = useState(false)
  const [checking, setChecking] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    if (!isLoaded) return

    // Check access via API - this works even if useUser() hook doesn't work on mobile
    // API will use session cookies to determine authentication
    // This allows authentication to work the same way as browser, then avoids Clerk hooks
    const checkAccess = async () => {
      try {
        const headers: HeadersInit = {
          "Content-Type": "application/json",
        }

        // Set headers if available (desktop), but API will use session cookies as fallback (mobile)
        if (user?.emailAddresses?.[0]?.emailAddress) {
          headers["x-user-email"] = user.emailAddresses[0].emailAddress
        }
        if (user?.id) {
          headers["x-user-clerk-id"] = user.id
        }
        if (user?.firstName || user?.lastName) {
          headers["x-user-name"] = `${user.firstName || ""} ${user.lastName || ""}`.trim()
        }

        const response = await fetch("/api/auth/check-access", {
          method: "GET",
          headers,
          credentials: 'include', // Ensure session cookies are sent (critical for mobile)
        })

        const data = await response.json()

        if (response.ok && data.success) {
          setHasAccess(true)
          setIsAuthenticated(true)
          setAccessChecked(true)
        } else if (response.status === 401) {
          // Not authenticated - redirect to Clerk sign-in
          setIsAuthenticated(false)
          setHasAccess(false)
          setAccessChecked(true)
          
          // Get current path to redirect back after sign-in
          const currentPath = window.location.pathname + window.location.search
          const signInUrl = `/sign-in?redirect_url=${encodeURIComponent(currentPath)}`
          
          console.log("🔐 [AccessGuard] Not authenticated, redirecting to sign-in:", signInUrl)
          router.push(signInUrl)
        } else {
          // Access denied (403) - user is authenticated but doesn't have access
          setIsAuthenticated(true)
          setHasAccess(false)
          setAccessChecked(true)
        }
      } catch (error) {
        console.error("Error checking access:", error)
        // On error, deny access (fail closed for security)
        setHasAccess(false)
        setAccessChecked(true)
      } finally {
        setChecking(false)
      }
    }

    // Always check access via API, even if user object is null
    // This allows mobile to authenticate via session cookies even if hooks don't work
    checkAccess()
  }, [user, isLoaded])

  // Show loading state while checking
  if (!isLoaded || checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-refuge-purple mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Checking access...</p>
        </div>
      </div>
    )
  }

  // If access check completed and user has access, render children
  // Note: We don't check user object here because on mobile, useUser() might not work
  // The API check above verifies authentication via session cookies

  // If access denied, show error page
  if (accessChecked && !hasAccess) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                <Shield className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <CardTitle className="text-xl">Access Denied</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
              <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-amber-800 dark:text-amber-200">
                <p className="font-semibold mb-1">External users require an invitation</p>
                <p>
                  Your account ({user?.emailAddresses?.[0]?.emailAddress || "unknown"}) does not have access to this platform.
                  Please contact an administrator to request access.
                </p>
              </div>
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              <p>
                If you believe this is an error, please contact{" "}
                <a href="mailto:jduarte@refugehouse.org" className="text-refuge-purple hover:underline">
                  jduarte@refugehouse.org
                </a>
                .
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Access granted - render children
  return <>{children}</>
}

