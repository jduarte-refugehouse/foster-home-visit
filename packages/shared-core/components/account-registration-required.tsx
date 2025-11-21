"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@refugehouse/shared-core/components/ui/card"
import { Shield, Mail } from "lucide-react"

interface AccountRegistrationRequiredProps {
  microserviceName?: string
  contactEmail?: string
}

/**
 * SECURITY: Standard component to display when user is authenticated but not found in the database.
 * This prevents showing any protected content or navigation links when user lacks database-level permissions.
 * 
 * PROTOCOL: Does NOT use Clerk hooks. Gets user info from sessionStorage or session API.
 * 
 * This component should be used consistently across ALL microservices.
 */
export function AccountRegistrationRequired({ 
  microserviceName = "this application",
  contactEmail = "jduarte@refugehouse.org"
}: AccountRegistrationRequiredProps) {
  const [userEmail, setUserEmail] = useState<string>("User")

  // Get user email from session (NO Clerk hooks)
  useEffect(() => {
    const storedUser = sessionStorage.getItem("session_user")
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser)
        if (parsed.email) {
          setUserEmail(parsed.email)
          return
        }
      } catch (e) {
        // Invalid stored data
      }
    }

    // Fetch from API if not in sessionStorage
    fetch("/api/auth/get-session-user", {
      method: "GET",
      credentials: "include",
    })
      .then(res => res.json())
      .then(data => {
        if (data.success && data.email) {
          setUserEmail(data.email)
        }
      })
      .catch(() => {
        // Ignore errors
      })
  }, [])

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-refuge-purple/10 rounded-lg">
              <Shield className="h-6 w-6 text-refuge-purple" />
            </div>
            <div>
              <CardTitle className="text-xl">Account Registration Required</CardTitle>
              <CardDescription>
                Access to {microserviceName} requires account registration
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-3 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
            <Mail className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-amber-800 dark:text-amber-200">
              <p className="font-semibold mb-1">Authentication Successful</p>
              <p>
                You are signed in as <strong>{userEmail}</strong>
              </p>
              <p className="mt-2">
                However, your account is not yet registered in the system database. 
                You need to be added to the application's user database to access this microservice.
              </p>
            </div>
          </div>
          
          <div className="text-sm text-muted-foreground">
            <p className="mb-2">
              To request access, please contact a system administrator:
            </p>
            <p>
              <a 
                href={`mailto:${contactEmail}?subject=Access Request for ${microserviceName}`}
                className="text-refuge-purple hover:underline font-medium"
              >
                {contactEmail}
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

