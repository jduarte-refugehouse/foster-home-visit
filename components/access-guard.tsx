"use client"

import { useEffect, useState } from "react"
import { useUser } from "@clerk/nextjs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, Shield } from "lucide-react"

interface AccessGuardProps {
  children: React.ReactNode
}

export function AccessGuard({ children }: AccessGuardProps) {
  const { user, isLoaded } = useUser()
  const [accessChecked, setAccessChecked] = useState(false)
  const [hasAccess, setHasAccess] = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    if (!isLoaded) return

    // If user is not signed in, Clerk will handle redirect
    if (!user) {
      setChecking(false)
      return
    }

    // Check access
    const checkAccess = async () => {
      try {
        const headers: HeadersInit = {
          "Content-Type": "application/json",
        }

        if (user.emailAddresses[0]?.emailAddress) {
          headers["x-user-email"] = user.emailAddresses[0].emailAddress
        }
        if (user.id) {
          headers["x-user-clerk-id"] = user.id
        }
        if (user.firstName || user.lastName) {
          headers["x-user-name"] = `${user.firstName || ""} ${user.lastName || ""}`.trim()
        }

        const response = await fetch("/api/auth/check-access", {
          method: "GET",
          headers,
        })

        const data = await response.json()

        if (response.ok && data.success) {
          setHasAccess(true)
          setAccessChecked(true)
        } else {
          // Access denied
          setHasAccess(false)
          setAccessChecked(true)
        }
      } catch (error) {
        console.error("Error checking access:", error)
        // On error, allow access for now (fail open) - but log the error
        setHasAccess(true)
        setAccessChecked(true)
      } finally {
        setChecking(false)
      }
    }

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

  // If user is not signed in, Clerk will handle redirect - just render children
  if (!user) {
    return <>{children}</>
  }

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
                  Your account ({user.emailAddresses[0]?.emailAddress}) does not have access to this platform.
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

