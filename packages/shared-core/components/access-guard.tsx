/**
 * @shared-core
 * This component should be moved to packages/shared-core/components/access-guard.tsx
 * Enhanced with microservice access checking and request functionality
 */

"use client"

import { useEffect, useState } from "react"
import { useUser } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@refugehouse/shared-core/components/ui/card"
import { Button } from "@refugehouse/shared-core/components/ui/button"
import { AlertCircle, Shield, Mail } from "lucide-react"
import { MICROSERVICE_CONFIG } from "@/lib/microservice-config"

interface AccessGuardProps {
  children: React.ReactNode
}

export function AccessGuard({ children }: AccessGuardProps) {
  const { user, isLoaded } = useUser()
  const router = useRouter()
  const [accessChecked, setAccessChecked] = useState(false)
  const [hasAccess, setHasAccess] = useState(false)
  const [hasMicroserviceAccess, setHasMicroserviceAccess] = useState(false)
  const [checking, setChecking] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [requesting, setRequesting] = useState(false)
  const [requestSubmitted, setRequestSubmitted] = useState(false)
  const [hasPendingRequest, setHasPendingRequest] = useState(false)

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
          setIsAuthenticated(true)
          setHasAccess(true)
          setHasMicroserviceAccess(data.hasMicroserviceAccess || false)
          
          // Check for pending requests if user doesn't have microservice access
          if (!data.hasMicroserviceAccess) {
            try {
              const requestResponse = await fetch("/api/access-requests", {
                headers,
                credentials: 'include',
              })
              const requestData = await requestResponse.json()
              if (requestData.hasPendingRequest) {
                setHasPendingRequest(true)
              }
            } catch (requestError) {
              console.error("Error checking access requests:", requestError)
              // Don't fail the access check if request check fails
            }
          }
          
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
          // Access denied (403) - user is authenticated but doesn't have platform access
          setIsAuthenticated(true)
          setHasAccess(false)
          setHasMicroserviceAccess(false)
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
  }, [user, isLoaded, router])

  const handleRequestAccess = async () => {
    setRequesting(true)
    try {
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      }
      if (user?.emailAddresses?.[0]?.emailAddress) {
        headers["x-user-email"] = user.emailAddresses[0].emailAddress
      }
      if (user?.id) {
        headers["x-user-clerk-id"] = user.id
      }

      const response = await fetch("/api/access-requests", {
        method: "POST",
        headers,
        credentials: 'include',
      })

      const data = await response.json()
      if (data.success) {
        setRequestSubmitted(true)
        setHasPendingRequest(true)
      } else {
        alert(data.message || "Failed to submit request")
      }
    } catch (error) {
      console.error("Error requesting access:", error)
      alert("Failed to submit access request")
    } finally {
      setRequesting(false)
    }
  }

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

  // Platform access denied (external user without invitation)
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

  // Microservice access denied (user needs permissions for this specific service)
  if (accessChecked && hasAccess && !hasMicroserviceAccess) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-refuge-purple/10 rounded-lg">
                <Shield className="h-6 w-6 text-refuge-purple" />
              </div>
              <div>
                <CardTitle className="text-xl">Access Required</CardTitle>
                <CardDescription>
                  You need permission to access {MICROSERVICE_CONFIG.name}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {requestSubmitted || hasPendingRequest ? (
              <div className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <Mail className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-green-800 dark:text-green-200">
                  <p className="font-semibold mb-1">Request Submitted</p>
                  <p>
                    Your access request has been submitted. A system administrator will review your request and notify you once access is granted.
                  </p>
                </div>
              </div>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">
                  If you need access to this application, click the button below to request permissions.
                  A system administrator will review your request.
                </p>
                <Button 
                  onClick={handleRequestAccess} 
                  disabled={requesting}
                  className="w-full"
                >
                  {requesting ? "Submitting..." : "Request Access"}
                </Button>
              </>
            )}
            <div className="text-xs text-muted-foreground text-center">
              <p>
                Questions? Contact{" "}
                <a href="mailto:jduarte@refugehouse.org" className="text-refuge-purple hover:underline">
                  jduarte@refugehouse.org
                </a>
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

