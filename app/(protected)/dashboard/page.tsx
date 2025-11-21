"use client"

// Rebuilt dashboard - simple, clean implementation matching working pages
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useUser } from "@clerk/nextjs"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@refugehouse/shared-core/components/ui/card"
import { Home, Calendar, FileText, BarChart3, Map, List, Shield, Database } from "lucide-react"
import Link from "next/link"

export default function DashboardPage() {
  const { user, isLoaded: userLoaded } = useUser()
  const router = useRouter()
  const [microserviceCode, setMicroserviceCode] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // Get user headers for API calls
  const getUserHeaders = () => {
    if (!user) return {}
    return {
      "Content-Type": "application/json",
      "x-user-email": user.emailAddresses[0]?.emailAddress || "",
      "x-user-clerk-id": user.id,
      "x-user-name": `${user.firstName || ""} ${user.lastName || ""}`.trim(),
    }
  }

  const [userInfo, setUserInfo] = useState<any>(null)
  const [hasDatabaseAccess, setHasDatabaseAccess] = useState(false)

  // Get microservice code and handle redirects
  useEffect(() => {
    if (!userLoaded || !user) {
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
        
        // SECURITY: Check if user is found in database
        const userFound = data.metadata?.userInfo !== null && data.metadata?.userInfo !== undefined
        setUserInfo(data.metadata?.userInfo)
        setHasDatabaseAccess(userFound)
        
        // Redirect service-domain-admin to its own dashboard
        if (code === 'service-domain-admin') {
          router.replace('/globaladmin')
          return
        }
        
        setLoading(false)
      })
      .catch((error) => {
        console.error('Error fetching navigation:', error)
        // SECURITY: On error, assume no database access
        setHasDatabaseAccess(false)
        setMicroserviceCode('home-visits')
        setLoading(false)
      })
  }, [userLoaded, user, router])

  // Show loading state while user is loading
  if (!userLoaded || loading) {
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

  // Don't render if redirecting to globaladmin
  if (microserviceCode === 'service-domain-admin') {
    return null
  }

  // SECURITY: If Clerk authenticated but user not found in database, show limited view
  if (user && !hasDatabaseAccess) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <div>
          <h1 className="text-3xl font-bold">Access Required</h1>
          <p className="text-muted-foreground mt-2">
            You are signed in as {user?.emailAddresses?.[0]?.emailAddress || user?.firstName || "User"}
          </p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Account Registration Required</CardTitle>
            <CardDescription>
              Your account needs to be registered in the system to access this application.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Please contact an administrator to request access. Your Clerk authentication is working, 
              but your account is not yet registered in the database.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Simple, clean dashboard for home-visits (only shown if user found in database)
  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Home Visits Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Welcome back, {user?.firstName || "User"} - Manage foster home visits and related tasks
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
