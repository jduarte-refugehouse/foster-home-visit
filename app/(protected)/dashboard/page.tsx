"use client"

// Rebuilt dashboard - simple, clean implementation matching working pages
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useUser } from "@clerk/nextjs"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@refugehouse/shared-core/components/ui/card"
import { AccountRegistrationRequired } from "@refugehouse/shared-core/components/account-registration-required"
import { useDatabaseAccess } from "@refugehouse/shared-core/hooks/use-database-access"
import { usePermissions } from "@refugehouse/shared-core/hooks/use-permissions"
import { Home, Calendar, FileText, BarChart3, Map, List, Shield, Database, Clock, MapPin, User, Home as HomeIcon } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { Badge } from "@refugehouse/shared-core/components/ui/badge"
import { Button } from "@refugehouse/shared-core/components/ui/button"

interface HomeLiaisonAppointment {
  appointment_id: string
  title: string
  home_name: string
  start_datetime: string
  end_datetime: string
  status: string
  priority: string
  location_address: string
  assigned_to_name: string
  form_status: string | null
  visit_form_id: string | null
}

export default function DashboardPage() {
  const router = useRouter()
  const { user, isLoaded } = useUser()
  const [microserviceCode, setMicroserviceCode] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [homeLiaisonData, setHomeLiaisonData] = useState<{
    appointments: HomeLiaisonAppointment[]
    onCall?: any[]
    currentOnCall?: any | null
    stats: {
      today: number
      thisWeek: number
      pendingVisits: number
      onCallShifts: number
      isCurrentlyOnCall?: boolean
    }
  } | null>(null)
  const [loadingLiaisonData, setLoadingLiaisonData] = useState(false)

  const { hasAccess: hasDatabaseAccess, userInfo, isLoading: checkingDatabaseAccess } = useDatabaseAccess()
  const permissions = usePermissions()

  // Get user headers for API calls (from Clerk user)
  const getUserHeaders = (): HeadersInit => {
    if (!user) {
      return {
        "Content-Type": "application/json",
      }
    }
    return {
      "Content-Type": "application/json",
      "x-user-email": user.emailAddresses[0]?.emailAddress || "",
      "x-user-clerk-id": user.id,
      "x-user-name": `${user.firstName || ""} ${user.lastName || ""}`.trim(),
    }
  }

  // Get microservice code and handle redirects
  useEffect(() => {
    if (!isLoaded || !user || checkingDatabaseAccess) {
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
  }, [isLoaded, user, router, checkingDatabaseAccess])

  // Fetch home liaison dashboard data (always show for now - testing)
  useEffect(() => {
    if (!isLoaded || !user || checkingDatabaseAccess) {
      return
    }

    // Always fetch home liaison dashboard data (removed role check for testing)
    setLoadingLiaisonData(true)
    
      fetch('/api/dashboard/home-liaison', {
        headers: getUserHeaders(),
        credentials: 'include',
      })
        .then(res => res.json())
      .then(data => {
        if (data.error || !data.success) {
          console.error('Error fetching home liaison data:', data.error || 'Unknown error')
          setHomeLiaisonData(null)
        } else if (data.data) {
          // Map API response structure to match original dashboard format
          setHomeLiaisonData({
            appointments: data.data.upcomingAppointments || [],
            onCall: data.data.upcomingOnCall || [],
            currentOnCall: data.data.currentOnCall || null,
            stats: {
              today: data.data.stats?.todayCount || 0,
              thisWeek: data.data.stats?.weekCount || 0,
              pendingVisits: data.data.stats?.pendingVisits || 0,
              onCallShifts: data.data.stats?.upcomingOnCallCount || 0,
              isCurrentlyOnCall: data.data.stats?.isCurrentlyOnCall || false,
            }
          })
        } else {
          setHomeLiaisonData(null)
        }
      })
      .catch((error) => {
        console.error('Error fetching home liaison dashboard:', error)
        setHomeLiaisonData(null)
      })
      .finally(() => {
        setLoadingLiaisonData(false)
      })
  }, [isLoaded, user, checkingDatabaseAccess])

  // Show loading state while checking access
  if (!isLoaded || loading || checkingDatabaseAccess) {
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

  // SECURITY: If no user, redirect to sign-in
  if (!user) {
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

  // Always show home liaison dashboard (for testing - removed role check)
  if (true) {
    if (loadingLiaisonData) {
      return (
        <div className="flex flex-col gap-6 p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded w-1/3"></div>
            <div className="grid gap-4 md:grid-cols-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-24 bg-slate-200 dark:bg-slate-800 rounded"></div>
              ))}
            </div>
            <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded"></div>
          </div>
        </div>
      )
    }

    if (homeLiaisonData && homeLiaisonData.appointments) {
      const today = new Date()
      const todayStart = new Date(today.setHours(0, 0, 0, 0))
      const todayEnd = new Date(today.setHours(23, 59, 59, 999))
      const weekEnd = new Date(today)
      weekEnd.setDate(today.getDate() + 7)

      const todayAppointments = (homeLiaisonData.appointments || []).filter(apt => {
        if (!apt || !apt.start_datetime) return false
        const aptDate = new Date(apt.start_datetime)
        return aptDate >= todayStart && aptDate <= todayEnd
      })

      const thisWeekAppointments = (homeLiaisonData.appointments || []).filter(apt => {
        if (!apt || !apt.start_datetime) return false
        const aptDate = new Date(apt.start_datetime)
        return aptDate >= todayStart && aptDate <= weekEnd
      })

      return (
        <div className="flex flex-col gap-6 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Welcome back, {user ? `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.emailAddresses[0]?.emailAddress || "User" : "User"}</h1>
              <p className="text-muted-foreground mt-2">
                Manage your schedule, on-call assignments, and upcoming home visits
              </p>
            </div>
            <Link href="/home-visit-guide">
              <Button className="bg-refuge-purple hover:bg-refuge-purple/90">
                <FileText className="h-4 w-4 mr-2" />
                Home Visit Guide
              </Button>
            </Link>
          </div>

          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-refuge-purple" />
                  Today's Visits
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{homeLiaisonData.stats.today}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Clock className="h-4 w-4 text-pink-600" />
                  This Week
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{homeLiaisonData.stats.thisWeek}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Shield className="h-4 w-4 text-yellow-600" />
                  Pending Visits
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{homeLiaisonData.stats.pendingVisits}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Shield className="h-4 w-4 text-blue-500" />
                  On-Call Shifts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{homeLiaisonData.stats.onCallShifts}</div>
              </CardContent>
            </Card>
          </div>

          {/* Upcoming Home Visits */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-refuge-purple" />
                Upcoming Home Visits
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!homeLiaisonData.appointments || homeLiaisonData.appointments.length === 0 ? (
                <p className="text-sm text-muted-foreground">No upcoming visits scheduled.</p>
              ) : (
                <div className="space-y-3">
                  {homeLiaisonData.appointments.slice(0, 5).map((apt) => (
                    <Link key={apt.appointment_id} href={`/appointment/${apt.appointment_id}`}>
                      <div className="flex items-start gap-4 p-3 border rounded-lg hover:bg-accent transition-colors cursor-pointer">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold">{apt.title}</h3>
                            <Badge variant={apt.status === 'completed' ? 'default' : 'secondary'}>
                              {apt.status}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <HomeIcon className="h-4 w-4" />
                              {apt.home_name || 'Unknown Home'}
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {format(new Date(apt.start_datetime), 'MMM d, h:mm a')}
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
              <div className="mt-4">
                <Link href="/visits-calendar">
                  <Button variant="outline" className="w-full">
                    View All Visits
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Upcoming On-Call Shifts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-blue-500" />
                Upcoming On-Call Shifts
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!homeLiaisonData.onCall || homeLiaisonData.onCall.length === 0 ? (
                <p className="text-sm text-muted-foreground">No upcoming on-call shifts scheduled.</p>
              ) : (
                <div className="space-y-3">
                  {homeLiaisonData.onCall.slice(0, 5).map((shift: any, index: number) => (
                    <div key={index} className="flex items-start gap-4 p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold">On-Call Shift</h3>
                          {homeLiaisonData.currentOnCall && index === 0 && (
                            <Badge variant="default">Current</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {shift.start_datetime && format(new Date(shift.start_datetime), 'MMM d, h:mm a')} - {shift.end_datetime && format(new Date(shift.end_datetime), 'h:mm a')}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-4">
                <Link href="/on-call-schedule">
                  <Button variant="outline" className="w-full">
                    Manage On-Call Schedule
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <div className="grid gap-4 md:grid-cols-3">
            <Link href="/visits-calendar">
              <Card className="hover:bg-accent transition-colors cursor-pointer h-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-refuge-purple" />
                    View Calendar
                  </CardTitle>
                </CardHeader>
              </Card>
            </Link>
            <Link href="/visits-list">
              <Card className="hover:bg-accent transition-colors cursor-pointer h-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-pink-600" />
                    Visits List
                  </CardTitle>
                </CardHeader>
              </Card>
            </Link>
            <Link href="/on-call-schedule">
              <Card className="hover:bg-accent transition-colors cursor-pointer h-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-blue-500" />
                    On-Call Schedule
                  </CardTitle>
                </CardHeader>
              </Card>
            </Link>
          </div>
        </div>
      )
    }
  }

  // Simple, clean dashboard for home-visits (only shown if user found in database)
  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Home Visits Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Welcome back, {user ? `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.emailAddresses[0]?.emailAddress || "User" : "User"} - Manage foster home visits and related tasks
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
