"use client"

import { useState, useEffect } from "react"
import { usePermissions } from "@/hooks/use-permissions"
import { AdminDashboard } from "@/components/dashboards/admin-dashboard"
import { StaffDashboard } from "@/components/dashboards/staff-dashboard"
import { ExternalUserDashboard } from "@/components/dashboards/external-user-dashboard"
import { NoPermissionsDashboard } from "@/components/dashboards/no-permissions-dashboard"
import { SchedulingAdminDashboard } from "@/components/dashboards/scheduling-admin-dashboard"
import { QADirectorDashboard } from "@/components/dashboards/qa-director-dashboard"
import { CaseManagerDashboard } from "@/components/dashboards/case-manager-dashboard"
import { HomeVisitLiaisonDashboard } from "@/components/dashboards/home-visit-liaison-dashboard"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
  Home,
  MapPin,
  Users,
  Building2,
  RefreshCw,
  TrendingUp,
  Clock,
  Database,
  CheckCircle,
  AlertCircle,
} from "lucide-react"
import Link from "next/link"

interface DashboardData {
  overview: {
    totalHomes: number
    mappedHomes: number
    coordinateCompleteness: number
    activeCaseManagers: number
    serviceUnits: number
  }
  distribution: {
    byUnit: Record<string, number>
    byCaseManager: Record<string, number>
  }
  caseManagerWorkload: Array<{
    manager: string
    homeCount: number
    isUnassigned: boolean
  }>
  recentActivity: Array<{
    action: string
    timestamp: string
    type: string
  }>
  lastUpdated: string
}

export default function DashboardPage() {
  const { isLoaded, roles, permissions, isAdmin, isSystemAdmin } = usePermissions()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchDashboardData = async () => {
    setLoading(true)
    setError(null)

    try {
      console.log("📊 Fetching dashboard data...")
      const response = await fetch("/api/dashboard-data")

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()

      if (result.success) {
        setData(result.data)
        console.log("✅ Dashboard data loaded successfully")
      } else {
        throw new Error(result.error || "Failed to fetch dashboard data")
      }
    } catch (err) {
      console.error("❌ Error fetching dashboard data:", err)
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
  }, [])

  if (!isLoaded) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-96">
          <div className="animate-pulse text-center">
            <div className="h-8 bg-gray-200 rounded w-48 mx-auto mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-32 mx-auto"></div>
          </div>
        </div>
      </div>
    )
  }

  // System Admin gets the admin dashboard
  if (isSystemAdmin) {
    return <AdminDashboard />
  }

  // Determine which dashboard to show based on roles and permissions
  const primaryRole = roles[0]?.roleName

  switch (primaryRole) {
    case "scheduling_admin":
      return <SchedulingAdminDashboard />

    case "qa_director":
      return <QADirectorDashboard />

    case "case_manager":
      return <CaseManagerDashboard />

    case "home_visit_liaison":
      return <HomeVisitLiaisonDashboard />

    default:
      // Fallback based on permissions
      if (permissions.includes("view_homes")) {
        return <StaffDashboard />
      }

      if (roles.length > 0 || permissions.length > 0) {
        return <ExternalUserDashboard />
      }

      return <NoPermissionsDashboard />
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-96">
          <div className="flex items-center gap-2">
            <RefreshCw className="h-6 w-6 animate-spin" />
            <span>Loading dashboard...</span>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-red-600">
              <AlertCircle className="h-12 w-12 mx-auto mb-4" />
              <p className="font-semibold">Error loading dashboard</p>
              <p className="text-sm mt-2">{error}</p>
              <Button onClick={fetchDashboardData} className="mt-4">
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <p>No dashboard data available</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold">Home Visits Dashboard</h1>
            <Badge variant="default" className="bg-purple-600">
              Agency Facing
            </Badge>
            <Badge variant="outline" className="text-green-600 border-green-600">
              <CheckCircle className="h-3 w-3 mr-1" />
              Connected
            </Badge>
          </div>
          <p className="text-muted-foreground">Refuge House Staff Interface - Foster & Adoptive Home Management</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-sm text-muted-foreground">
            Last updated: {new Date(data.lastUpdated).toLocaleTimeString()}
          </div>
          <Button onClick={fetchDashboardData} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Homes</CardTitle>
            <Home className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.overview.totalHomes}</div>
            <p className="text-xs text-muted-foreground">Foster & Adoptive Homes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mapped Locations</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.overview.mappedHomes}</div>
            <div className="flex items-center gap-2 mt-1">
              <Progress value={data.overview.coordinateCompleteness} className="flex-1" />
              <span className="text-xs text-muted-foreground">{data.overview.coordinateCompleteness}%</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Case Managers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.overview.activeCaseManagers}</div>
            <p className="text-xs text-muted-foreground">Active Case Managers</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Service Units</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.overview.serviceUnits}</div>
            <p className="text-xs text-muted-foreground">Active Units</p>
          </CardContent>
        </Card>
      </div>

      {/* Distribution and Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Unit Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Distribution by Unit
            </CardTitle>
            <CardDescription>Foster homes across service units</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(data.distribution.byUnit).map(([unit, count]) => (
                <div key={unit} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant={unit === "DAL" ? "default" : "destructive"}>
                      {unit === "DAL" ? "Dallas" : "San Antonio"}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-sm font-medium">{count} homes</div>
                    <div className="text-xs text-muted-foreground">
                      ({Math.round((count / data.overview.totalHomes) * 100)}%)
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Case Manager Workload */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Case Manager Workload
            </CardTitle>
            <CardDescription>Home assignments per case manager</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-48 overflow-y-auto">
              {data.caseManagerWorkload.slice(0, 8).map((manager, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`text-sm ${manager.isUnassigned ? "text-orange-600 font-medium" : ""}`}>
                      {manager.manager}
                    </div>
                    {manager.isUnassigned && (
                      <Badge variant="outline" className="text-orange-600 border-orange-600">
                        Needs Assignment
                      </Badge>
                    )}
                  </div>
                  <div className="text-sm font-medium">{manager.homeCount}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Recent Activity
          </CardTitle>
          <CardDescription>System updates and data synchronization</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.recentActivity.map((activity, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className={`p-2 rounded-full ${activity.type === "system" ? "bg-blue-100" : "bg-green-100"}`}>
                  {activity.type === "system" ? (
                    <Database className="h-3 w-3 text-blue-600" />
                  ) : (
                    <CheckCircle className="h-3 w-3 text-green-600" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium">{activity.action}</div>
                  <div className="text-xs text-muted-foreground">{new Date(activity.timestamp).toLocaleString()}</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks for agency staff</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button asChild variant="outline" className="h-auto p-4 bg-transparent">
              <Link href="/homes-list">
                <div className="flex flex-col items-center gap-2">
                  <Home className="h-6 w-6" />
                  <div className="text-center">
                    <div className="font-medium">View All Homes</div>
                    <div className="text-xs text-muted-foreground">Browse complete list</div>
                  </div>
                </div>
              </Link>
            </Button>

            <Button asChild variant="outline" className="h-auto p-4 bg-transparent">
              <Link href="/homes-map">
                <div className="flex flex-col items-center gap-2">
                  <MapPin className="h-6 w-6" />
                  <div className="text-center">
                    <div className="font-medium">Geographic Map</div>
                    <div className="text-xs text-muted-foreground">View locations</div>
                  </div>
                </div>
              </Link>
            </Button>

            <Button asChild variant="outline" className="h-auto p-4 bg-transparent">
              <Link href="/auth-test">
                <div className="flex flex-col items-center gap-2">
                  <Users className="h-6 w-6" />
                  <div className="text-center">
                    <div className="font-medium">Test Authentication</div>
                    <div className="text-xs text-muted-foreground">User management</div>
                  </div>
                </div>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
