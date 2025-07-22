"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Home, Users, MapPin, TrendingUp, AlertTriangle, Database, Clock, CheckCircle } from "lucide-react"

export const dynamic = "force-dynamic"

interface DashboardData {
  totalHomes: number
  homesWithCoordinates: number
  coordinateCompleteness: number
  totalUnits: number
  totalCaseManagers: number
  avgHomesPerManager: number
  unitDistribution: Record<string, number>
  caseManagerDistribution: Record<string, number>
  recentActivity: Array<{
    type: string
    message: string
    timestamp: string
    status: string
  }>
  systemHealth: {
    databaseConnection: boolean
    dataFreshness: string
    lastSync: string
  }
}

export default function DashboardPage() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch("/api/dashboard-data")
      if (!response.ok) {
        throw new Error("Failed to fetch dashboard data")
      }

      const data = await response.json()
      setDashboardData(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
  }, [])

  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Agency Dashboard</h1>
          <p className="text-muted-foreground">Loading dashboard data...</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Agency Dashboard</h1>
          <p className="text-red-600">Error loading dashboard: {error}</p>
        </div>
        <Button onClick={fetchDashboardData}>Retry</Button>
      </div>
    )
  }

  if (!dashboardData) return null

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Agency Dashboard</h1>
          <p className="text-muted-foreground">Home Visits Management System - Agency Facing Interface</p>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="secondary">Agency Facing</Badge>
            <Badge variant="outline">Refuge House Staff</Badge>
            {dashboardData.systemHealth.databaseConnection && (
              <Badge variant="default" className="bg-green-600">
                <Database className="w-3 h-3 mr-1" />
                Connected
              </Badge>
            )}
          </div>
        </div>
        <div className="text-right text-sm text-muted-foreground">
          <p>Last Updated: {new Date(dashboardData.systemHealth.lastSync).toLocaleString()}</p>
          <p>Data Status: {dashboardData.systemHealth.dataFreshness}</p>
        </div>
      </div>

      {/* Core Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Foster/Adoptive Homes</CardTitle>
            <Home className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.totalHomes}</div>
            <p className="text-xs text-muted-foreground">Active homes in system</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mapped Locations</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.homesWithCoordinates}</div>
            <p className="text-xs text-muted-foreground">
              <span className={dashboardData.coordinateCompleteness >= 80 ? "text-green-600" : "text-orange-600"}>
                {dashboardData.coordinateCompleteness}% complete
              </span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Case Managers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.totalCaseManagers}</div>
            <p className="text-xs text-muted-foreground">Avg {dashboardData.avgHomesPerManager} homes each</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Service Units</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.totalUnits}</div>
            <p className="text-xs text-muted-foreground">Active service units</p>
          </CardContent>
        </Card>
      </div>

      {/* Distribution Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Homes by Service Unit</CardTitle>
            <CardDescription>Distribution of homes across service units</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(dashboardData.unitDistribution)
              .sort(([, a], [, b]) => b - a)
              .slice(0, 5)
              .map(([unit, count]) => (
                <div key={unit} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{unit || "Unassigned"}</p>
                    <p className="text-sm text-muted-foreground">{count} homes</p>
                  </div>
                  <Badge variant="outline">{count}</Badge>
                </div>
              ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent System Activity</CardTitle>
            <CardDescription>Latest updates and system events</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {dashboardData.recentActivity.map((activity, index) => (
              <div key={index} className="flex items-start space-x-3">
                {activity.status === "completed" ? (
                  <CheckCircle className="h-4 w-4 mt-0.5 text-green-500" />
                ) : activity.status === "info" ? (
                  <AlertTriangle className="h-4 w-4 mt-0.5 text-blue-500" />
                ) : (
                  <Clock className="h-4 w-4 mt-0.5 text-orange-500" />
                )}
                <div className="flex-1">
                  <p className="text-sm font-medium">{activity.message}</p>
                  <p className="text-xs text-muted-foreground">{new Date(activity.timestamp).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common agency tasks and navigation</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" className="justify-start bg-transparent" asChild>
              <a href="/homes-list">
                <Home className="mr-2 h-4 w-4" />
                View All Homes
              </a>
            </Button>
            <Button variant="outline" className="justify-start bg-transparent" asChild>
              <a href="/homes-map">
                <MapPin className="mr-2 h-4 w-4" />
                View Homes Map
              </a>
            </Button>
            <Button variant="outline" className="justify-start bg-transparent" asChild>
              <a href="/auth-test">
                <Users className="mr-2 h-4 w-4" />
                Test Authentication
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
