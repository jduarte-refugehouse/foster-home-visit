"use client"

import { useState, useEffect } from "react"
import { useUser } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Home, Map, Users, Shield, ExternalLink, Calendar, Clock, CheckCircle2, BookOpen, AlertCircle, Phone } from "lucide-react"
import { usePermissions } from "@/hooks/use-permissions"
import { useDeviceType } from "@/hooks/use-device-type"
import Link from "next/link"
import { format, parseISO, isToday, isTomorrow } from "date-fns"

interface DashboardData {
  totalHomes: number
  activeCaseManagers: number
  recentActivity: string
  systemStatus: "healthy" | "warning" | "error"
}

export default function DashboardPage() {
  const { user } = useUser()
  const router = useRouter()
  const permissions = usePermissions()
  const { isMobile } = useDeviceType()
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [liaisonData, setLiaisonData] = useState<any>(null)
  const [liaisonLoading, setLiaisonLoading] = useState(true)

  // Check if user has home_liaison role
  const isHomeLiaison = permissions.hasRole("home_liaison", "home-visits")

  // TEMPORARY: Show Liaison Dashboard for ALL users for testing
  // TODO: Revert to role-based check once impersonation/auth is working
  const showLiaisonDashboard = true // Changed from: isHomeLiaison

  // Optional: Redirect mobile users to mobile-optimized dashboard
  // Uncomment the lines below if you want automatic redirection
  // useEffect(() => {
  //   if (isMobile) {
  //     router.replace("/mobile")
  //   }
  // }, [isMobile, router])

  const fetchDashboardData = async () => {
    try {
      const response = await fetch("/api/dashboard-data")
      const data = await response.json()
      setDashboardData(data)
      setLoading(false)
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
      setLoading(false)
    }
  }

  useEffect(() => {
    // TEMPORARY: Always load liaison dashboard for all users
    // TODO: Revert to role-based check: if (showLiaisonDashboard) { ... } else { ... }
    fetchLiaisonDashboardData()
  }, []) // Removed dependencies - always load liaison dashboard

  const fetchLiaisonDashboardData = async () => {
    try {
      const response = await fetch("/api/dashboard/home-liaison")
      const data = await response.json()
      if (data.success) {
        setLiaisonData(data.data)
      }
      setLiaisonLoading(false)
    } catch (error) {
      console.error("Error fetching liaison dashboard data:", error)
      setLiaisonLoading(false)
    }
  }

  // Show Home Liaison dashboard (TEMPORARY: for all users)
  // TODO: Revert to: if (isHomeLiaison) {
  if (showLiaisonDashboard) {
    if (liaisonLoading) {
      return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="animate-pulse space-y-8">
            <div className="h-32 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
              <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
            </div>
          </div>
        </div>
      )
    }

    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
        {/* Welcome Banner with Guide Link */}
        <div className="bg-gradient-to-br from-refuge-purple/10 via-transparent to-refuge-magenta/10 border border-slate-200 dark:border-slate-800 p-8 rounded-xl">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                Welcome back, {user?.firstName || "Home Liaison"}
              </h1>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                Manage your schedule, on-call assignments, and upcoming home visits
              </p>
            </div>
            <Link href="/guide">
              <Button
                className="bg-refuge-purple hover:bg-refuge-purple-dark text-white font-medium px-6 py-3 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md flex items-center gap-2"
              >
                <BookOpen className="h-5 w-5" />
                Home Visit Guide
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Today's Visits</p>
                  <p className="text-3xl font-bold text-slate-900 dark:text-slate-100 mt-2">
                    {liaisonData?.stats.todayCount || 0}
                  </p>
                </div>
                <div className="p-3 bg-refuge-purple/10 dark:bg-refuge-purple/20 rounded-xl">
                  <Calendar className="h-6 w-6 text-refuge-purple" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">This Week</p>
                  <p className="text-3xl font-bold text-slate-900 dark:text-slate-100 mt-2">
                    {liaisonData?.stats.weekCount || 0}
                  </p>
                </div>
                <div className="p-3 bg-refuge-magenta/10 dark:bg-refuge-magenta/20 rounded-xl">
                  <Clock className="h-6 w-6 text-refuge-magenta" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Pending Visits</p>
                  <p className="text-3xl font-bold text-slate-900 dark:text-slate-100 mt-2">
                    {liaisonData?.stats.pendingVisits || 0}
                  </p>
                </div>
                <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-xl">
                  <AlertCircle className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">On-Call Shifts</p>
                  <p className="text-3xl font-bold text-slate-900 dark:text-slate-100 mt-2">
                    {liaisonData?.stats.upcomingOnCallCount || 0}
                  </p>
                </div>
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                  <Phone className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Current On-Call Status */}
        {liaisonData?.currentOnCall && (
          <Card className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-2 border-blue-300 dark:border-blue-700 rounded-xl shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-500 rounded-xl">
                    <Phone className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-semibold text-blue-900 dark:text-blue-100">
                      Currently On-Call
                    </CardTitle>
                    <p className="text-blue-700 dark:text-blue-300 text-sm mt-1">
                      {liaisonData.currentOnCall.on_call_type || "On-Call"} • Until{" "}
                      {format(parseISO(liaisonData.currentOnCall.end_datetime), "h:mm a")}
                    </p>
                  </div>
                </div>
                <Link href="/on-call-schedule">
                  <Button variant="outline" className="border-blue-300 text-blue-700 hover:bg-blue-50">
                    View Schedule
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Upcoming Visits */}
          <Card className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
            <CardHeader>
              <CardTitle className="text-xl font-semibold flex items-center gap-2">
                <Calendar className="h-5 w-5 text-refuge-purple" />
                Upcoming Home Visits
              </CardTitle>
            </CardHeader>
            <CardContent>
              {liaisonData?.upcomingAppointments && liaisonData.upcomingAppointments.length > 0 ? (
                <div className="space-y-3">
                  {liaisonData.upcomingAppointments.map((appointment: any) => {
                    const startDate = parseISO(appointment.start_datetime)
                    const isAppointmentToday = isToday(startDate)
                    const isAppointmentTomorrow = isTomorrow(startDate)

                    return (
                      <Link
                        key={appointment.appointment_id}
                        href={`/appointment/${appointment.appointment_id}`}
                        className="block p-4 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-refuge-purple/50 hover:bg-refuge-purple/5 transition-all"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                {isAppointmentToday
                                  ? "Today"
                                  : isAppointmentTomorrow
                                    ? "Tomorrow"
                                    : format(startDate, "MMM d")}
                              </span>
                              <span className="text-sm text-slate-500 dark:text-slate-400">
                                {format(startDate, "h:mm a")}
                              </span>
                              <Badge
                                variant={
                                  appointment.status === "scheduled"
                                    ? "default"
                                    : appointment.status === "in_progress"
                                      ? "secondary"
                                      : "outline"
                                }
                                className="text-xs"
                              >
                                {appointment.status}
                              </Badge>
                            </div>
                            <h3 className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                              {appointment.home_name || appointment.title}
                            </h3>
                            {appointment.location_address && (
                              <p className="text-sm text-slate-600 dark:text-slate-400 truncate mt-1">
                                {appointment.location_address}
                              </p>
                            )}
                          </div>
                          {appointment.form_status && (
                            <Badge
                              variant={appointment.form_status === "completed" ? "default" : "secondary"}
                              className="text-xs"
                            >
                              {appointment.form_status}
                            </Badge>
                          )}
                        </div>
                      </Link>
                    )
                  })}
                </div>
              ) : (
                <p className="text-slate-500 dark:text-slate-400 text-center py-8">
                  No upcoming visits scheduled
                </p>
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

          {/* On-Call Schedule */}
          <Card className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
            <CardHeader>
              <CardTitle className="text-xl font-semibold flex items-center gap-2">
                <Phone className="h-5 w-5 text-blue-600" />
                Upcoming On-Call Shifts
              </CardTitle>
            </CardHeader>
            <CardContent>
              {liaisonData?.upcomingOnCall && liaisonData.upcomingOnCall.length > 0 ? (
                <div className="space-y-3">
                  {liaisonData.upcomingOnCall.map((schedule: any) => {
                    const startDate = parseISO(schedule.start_datetime)
                    const endDate = parseISO(schedule.end_datetime)

                    return (
                      <div
                        key={schedule.id}
                        className="p-4 rounded-lg border border-slate-200 dark:border-slate-700"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                {isToday(startDate)
                                  ? "Today"
                                  : isTomorrow(startDate)
                                    ? "Tomorrow"
                                    : format(startDate, "MMM d")}
                              </span>
                              <Badge variant="outline" className="text-xs">
                                {schedule.on_call_type || "On-Call"}
                              </Badge>
                            </div>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                              {format(startDate, "h:mm a")} - {format(endDate, "h:mm a")}
                            </p>
                            {schedule.duration_hours && (
                              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                {schedule.duration_hours} hours
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="text-slate-500 dark:text-slate-400 text-center py-8">
                  No upcoming on-call shifts scheduled
                </p>
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
        </div>

        {/* Quick Actions */}
        <Card className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
          <CardHeader>
            <CardTitle className="text-xl font-semibold">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link href="/visits-calendar">
                <Button
                  variant="outline"
                  className="w-full h-auto py-4 flex flex-col items-center gap-2 hover:bg-refuge-purple/10 hover:border-refuge-purple/50"
                >
                  <Calendar className="h-6 w-6 text-refuge-purple" />
                  <span className="font-medium">View Calendar</span>
                </Button>
              </Link>
              <Link href="/visits-list">
                <Button
                  variant="outline"
                  className="w-full h-auto py-4 flex flex-col items-center gap-2 hover:bg-refuge-purple/10 hover:border-refuge-purple/50"
                >
                  <CheckCircle2 className="h-6 w-6 text-refuge-purple" />
                  <span className="font-medium">Visits List</span>
                </Button>
              </Link>
              <Link href="/on-call-schedule">
                <Button
                  variant="outline"
                  className="w-full h-auto py-4 flex flex-col items-center gap-2 hover:bg-blue-50 hover:border-blue-300"
                >
                  <Phone className="h-6 w-6 text-blue-600" />
                  <span className="font-medium">On-Call Schedule</span>
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="animate-pulse space-y-8">
          <div className="h-32 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
            <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-br from-refuge-purple/10 via-transparent to-refuge-magenta/10 border border-slate-200 dark:border-slate-800 p-8 rounded-xl">
        <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-slate-100 mb-2">
          Welcome to Home Visits Application
        </h1>
        <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
          Welcome back, {user?.firstName || "User"} - Foster care home visit scheduling and management
        </p>
      </div>

      {/* Main Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Foster Homes List Card */}
        <Card className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:border-refuge-purple/20">
          <CardHeader className="p-0 mb-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-refuge-purple/10 dark:bg-refuge-purple/20 rounded-xl">
                <Home className="h-6 w-6 text-refuge-purple dark:text-refuge-light-purple" />
              </div>
              <div>
                <CardTitle className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                  Foster Homes List
                </CardTitle>
                <p className="text-slate-600 dark:text-slate-400 text-sm">
                  View detailed information about all active foster homes in the system
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0 space-y-4">
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              Browse homes, contact information, case managers, and more
            </p>
            <Button
              asChild
              className="px-4 py-2 bg-refuge-purple hover:bg-refuge-purple/90 text-white font-medium rounded-lg transition-all duration-200 active:scale-95 transform shadow-sm hover:shadow-md"
            >
              <a href="/homes-list" className="inline-flex items-center gap-2">
                View Access
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          </CardContent>
        </Card>

        {/* Geographic Map Card */}
        <Card className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:border-refuge-magenta/20">
          <CardHeader className="p-0 mb-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-refuge-magenta/10 dark:bg-refuge-magenta/20 rounded-xl">
                <Map className="h-6 w-6 text-refuge-magenta" />
              </div>
              <div>
                <CardTitle className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                  Geographic Map
                </CardTitle>
                <p className="text-slate-600 dark:text-slate-400 text-sm">
                  Interactive map showing the geographic locations of foster homes
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0 space-y-4">
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              Visual map with filtering, search, and detailed home information
            </p>
            <Button
              asChild
              className="px-4 py-2 bg-refuge-magenta hover:bg-refuge-magenta/90 text-white font-medium rounded-lg transition-all duration-200 active:scale-95 transform shadow-sm hover:shadow-md"
            >
              <a href="/homes-map" className="inline-flex items-center gap-2">
                View Access
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Account Status Section */}
      <Card className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
        <CardHeader className="p-0 mb-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
              <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <CardTitle className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                Your Account Status
              </CardTitle>
              <p className="text-slate-600 dark:text-slate-400 text-sm">
                Current permissions and access level in Home Visits Application
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl text-center border border-slate-200 dark:border-slate-700">
              <div className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Email Domain</div>
              <div className="text-lg font-semibold text-slate-900 dark:text-slate-100">refugehouse.org</div>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl text-center border border-slate-200 dark:border-slate-700">
              <div className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Account Status</div>
              <Badge className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                Active
              </Badge>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl text-center border border-slate-200 dark:border-slate-700">
              <div className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Assigned Roles</div>
              <div className="text-lg font-semibold text-slate-900 dark:text-slate-100">1</div>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl text-center border border-slate-200 dark:border-slate-700">
              <div className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Permissions</div>
              <div className="text-lg font-semibold text-slate-900 dark:text-slate-100">6</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Default Access Level Section */}
      <Card className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
        <CardHeader className="p-0 mb-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
              <Shield className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <CardTitle className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                Default Access Level
              </CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 space-y-6">
          <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
            As a refugehouse.org domain user, you have default access to view foster homes information:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-slate-700 dark:text-slate-300">View foster homes list and details</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-slate-700 dark:text-slate-300">Filter and search home information</span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-slate-700 dark:text-slate-300">Access interactive geographic map</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-slate-700 dark:text-slate-300">View case manager contact details</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
            <div className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
              Additional Role-Based Access:
            </div>
            <div className="text-slate-700 dark:text-slate-300">admin in Home Visits Application</div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
