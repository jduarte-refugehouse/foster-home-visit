"use client"

// Rebuilt dashboard - simple, clean implementation matching working pages
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@refugehouse/shared-core/components/ui/card"
import { AccountRegistrationRequired } from "@refugehouse/shared-core/components/account-registration-required"
import { useDatabaseAccess } from "@refugehouse/shared-core/hooks/use-database-access"
import { Home, Calendar, FileText, BarChart3, Map, List, Shield, Database } from "lucide-react"
import Link from "next/link"

export default function DashboardPage() {
  const router = useRouter()
  const [microserviceCode, setMicroserviceCode] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [sessionUser, setSessionUser] = useState<{ id: string; email: string; name: string } | null>(null)
  const [loadingSession, setLoadingSession] = useState(true)

  const { hasAccess: hasDatabaseAccess, userInfo, isLoading: checkingDatabaseAccess } = useDatabaseAccess()

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

  // Get microservice code and handle redirects
  useEffect(() => {
    if (loadingSession || !sessionUser || checkingDatabaseAccess) {
      return
    }

    setLoading(true)

    fetch('/api/navigation', {
      headers: getUserHeaders(),
      credentials: 'include',
    })
      .then(res => res.json())
      .then(data => {
        const code = data.metadata?.microservice?.code || 'home-visits'
        setMicroserviceCode(code)
        
        // Redirect service-domain-admin to its own dashboard
        if (code === 'service-domain-admin') {
          router.replace('/globaladmin')
          return
        }
        
        setLoading(false)
      })
      .catch((error) => {
        console.error('Error fetching navigation:', error)
        setMicroserviceCode('home-visits')
        setLoading(false)
      })
  }, [loadingSession, sessionUser, router, checkingDatabaseAccess])

  // Show loading state while checking access
  if (loadingSession || loading || checkingDatabaseAccess) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded w-1/3"></div>
          <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/2"></div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
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

  // Don't render if redirecting to globaladmin
  if (microserviceCode === 'service-domain-admin') {
    return null
  }

  // SECURITY: If user is authenticated but not found in database, show registration required
  if (!hasDatabaseAccess) {
    return (
      <AccountRegistrationRequired 
        microserviceName="Home Visits"
        contactEmail="jduarte@refugehouse.org"
      />
    )
  }

  // Simple, clean dashboard for home-visits (only shown if user found in database)
  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Home Visits Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Welcome back, {sessionUser?.name || "User"} - Manage foster home visits and related tasks
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Link href="/visits-calendar">
          <Card className="hover:bg-accent transition-colors cursor-pointer h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Visits Calendar
              </CardTitle>
              <CardDescription>
                View and manage scheduled home visits
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/visit-forms">
          <Card className="hover:bg-accent transition-colors cursor-pointer h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Visit Forms
              </CardTitle>
              <CardDescription>
                Complete and review home visit forms
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/on-call-schedule">
          <Card className="hover:bg-accent transition-colors cursor-pointer h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                On-Call Schedule
              </CardTitle>
              <CardDescription>
                Manage on-call staff schedules
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/homes-map">
          <Card className="hover:bg-accent transition-colors cursor-pointer h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Map className="h-5 w-5" />
                Homes Map
              </CardTitle>
              <CardDescription>
                View foster homes on an interactive map
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/homes-list">
          <Card className="hover:bg-accent transition-colors cursor-pointer h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <List className="h-5 w-5" />
                Homes List
              </CardTitle>
              <CardDescription>
                Browse and search foster homes
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/reports">
          <Card className="hover:bg-accent transition-colors cursor-pointer h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Reports
              </CardTitle>
              <CardDescription>
                Generate and view visit reports
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
                Check system health and database connection
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Home className="h-5 w-5" />
            Quick Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Use the cards above to navigate to different sections of the Home Visits application.
            All features are accessible through the sidebar navigation as well.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
