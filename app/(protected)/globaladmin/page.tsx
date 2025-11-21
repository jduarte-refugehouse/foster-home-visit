"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@refugehouse/shared-core/components/ui/card"
import { AccountRegistrationRequired } from "@refugehouse/shared-core/components/account-registration-required"
import { useDatabaseAccess } from "@refugehouse/shared-core/hooks/use-database-access"
import { Users, Settings, Globe, Shield, Database } from "lucide-react"
import Link from "next/link"

export default function GlobalAdminDashboard() {
  const router = useRouter()
  const { hasAccess: hasDatabaseAccess, userInfo, isLoading: checkingAccess } = useDatabaseAccess()
  const [microserviceCode, setMicroserviceCode] = useState<string | null>(null)
  const [sessionUser, setSessionUser] = useState<{ id: string; email: string; name: string } | null>(null)
  const [loadingSession, setLoadingSession] = useState(true)

  // Get Clerk ID from session (NO Clerk hooks - follows protocol)
  useEffect(() => {
    const fetchSessionUser = async () => {
      // Check sessionStorage first
      const storedUser = sessionStorage.getItem("session_user")
      if (storedUser) {
        try {
          const parsed = JSON.parse(storedUser)
          if (parsed.clerkUserId) {
            setSessionUser({
              id: parsed.clerkUserId,
              email: parsed.email || "",
              name: parsed.name || "",
            })
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
            // Store in sessionStorage
            sessionStorage.setItem("session_user", JSON.stringify({
              clerkUserId: data.clerkUserId,
              email: data.email,
              name: data.name,
            }))
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

  // Get user headers for API calls (from session, NOT Clerk hooks)
  const getUserHeaders = () => {
    if (!sessionUser) return {}
    return {
      "Content-Type": "application/json",
      "x-user-email": sessionUser.email,
      "x-user-clerk-id": sessionUser.id,
      "x-user-name": sessionUser.name,
    }
  }

  // Get microservice code from navigation API
  useEffect(() => {
    if (loadingSession || !sessionUser || checkingAccess) {
      return
    }

    fetch('/api/navigation', {
      headers: getUserHeaders(),
      credentials: 'include',
    })
      .then(res => res.json())
      .then(data => {
        const code = data.metadata?.microservice?.code || 'home-visits'
        setMicroserviceCode(code)
        
        if (code !== 'service-domain-admin') {
          router.push('/dashboard')
        }
      })
      .catch(() => {
        // Fallback: check environment variable (only works if set as NEXT_PUBLIC)
        const envCode = process.env.NEXT_PUBLIC_MICROSERVICE_CODE || 'home-visits'
        setMicroserviceCode(envCode)
        if (envCode !== 'service-domain-admin') {
          router.push('/dashboard')
        }
      })
  }, [loadingSession, sessionUser, router, checkingAccess])

  // Show loading state while checking access
  if (loadingSession || checkingAccess) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded w-1/3"></div>
          <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/2"></div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-slate-200 dark:bg-slate-800 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // SECURITY: If no session user, redirect to sign-in
  if (!sessionUser) {
    router.push('/sign-in')
    return null
  }

  // SECURITY: If user is authenticated but not found in database, show registration required
  if (!hasDatabaseAccess) {
    return (
      <AccountRegistrationRequired 
        microserviceName="Domain Administration"
        contactEmail="jduarte@refugehouse.org"
      />
    )
  }

  if (!microserviceCode || microserviceCode !== 'service-domain-admin') {
    return null
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Domain Administration</h1>
        <p className="text-muted-foreground mt-2">
          Manage users, microservices, and domain configuration across the platform
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Link href="/globaladmin/users">
          <Card className="hover:bg-accent transition-colors cursor-pointer h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                User Admin
              </CardTitle>
              <CardDescription>
                Manage users across all microservices, including roles and permissions
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/globaladmin/microservices">
          <Card className="hover:bg-accent transition-colors cursor-pointer h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Microservice Configuration
              </CardTitle>
              <CardDescription>
                Configure microservices, navigation items, and service settings
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/globaladmin/domains">
          <Card className="hover:bg-accent transition-colors cursor-pointer h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Domain Admin
              </CardTitle>
              <CardDescription>
                Manage domain-level settings and cross-microservice configuration
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/diagnostics">
          <Card className="hover:bg-accent transition-colors cursor-pointer h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Diagnostics
              </CardTitle>
              <CardDescription>
                View system health, database connection status, and configuration details
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            System Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Welcome to the Refuge House Microservice Domain Administration portal.
            Use the cards above to access different administration areas.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

