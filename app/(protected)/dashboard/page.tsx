"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Home, Users, Calendar, MapPin, BarChart3, AlertCircle, CheckCircle, Clock } from "lucide-react"
import { MICROSERVICE_CONFIG } from "@/lib/microservice-config"

interface DashboardData {
  totalHomes: number
  activeHomes: number
  totalVisits: number
  upcomingVisits: number
  recentActivity: Array<{
    id: string
    type: string
    description: string
    timestamp: string
    status: "completed" | "pending" | "overdue"
  }>
  systemStatus: {
    database: "healthy" | "warning" | "error"
    lastSync: string
  }
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        const response = await fetch("/api/dashboard-data")
        if (!response.ok) {
          throw new Error("Failed to fetch dashboard data")
        }
        const result = await response.json()
        setData(result)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error")
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-3 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{MICROSERVICE_CONFIG.name}</h1>
          <p className="text-muted-foreground">{MICROSERVICE_CONFIG.description}</p>
        </div>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Failed to load dashboard data: {error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{MICROSERVICE_CONFIG.name}</h1>
        <p className="text-muted-foreground">
          Welcome to {MICROSERVICE_CONFIG.name}. {MICROSERVICE_CONFIG.description}
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Homes</CardTitle>
            <Home className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.totalHomes || 0}</div>
            <p className="text-xs text-muted-foreground">{data?.activeHomes || 0} currently active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Visits</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.totalVisits || 0}</div>
            <p className="text-xs text-muted-foreground">All time visits recorded</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Visits</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.upcomingVisits || 0}</div>
            <p className="text-xs text-muted-foreground">Scheduled for next 30 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Status</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              {data?.systemStatus.database === "healthy" ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-500" />
              )}
              <Badge variant={data?.systemStatus.database === "healthy" ? "default" : "destructive"}>
                {data?.systemStatus.database || "Unknown"}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Last sync: {data?.systemStatus.lastSync || "Unknown"}</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest updates from the {MICROSERVICE_CONFIG.name.toLowerCase()} system</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data?.recentActivity && data.recentActivity.length > 0 ? (
                data.recentActivity.slice(0, 5).map((activity) => (
                  <div key={activity.id} className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      {activity.status === "completed" && <CheckCircle className="h-4 w-4 text-green-500" />}
                      {activity.status === "pending" && <Clock className="h-4 w-4 text-yellow-500" />}
                      {activity.status === "overdue" && <AlertCircle className="h-4 w-4 text-red-500" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{activity.description}</p>
                      <p className="text-sm text-gray-500">{new Date(activity.timestamp).toLocaleDateString()}</p>
                    </div>
                    <Badge
                      variant={
                        activity.status === "completed"
                          ? "default"
                          : activity.status === "pending"
                            ? "secondary"
                            : "destructive"
                      }
                    >
                      {activity.status}
                    </Badge>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No recent activity</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks for {MICROSERVICE_CONFIG.name.toLowerCase()}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2">
              <Button variant="outline" className="justify-start bg-transparent" asChild>
                <a href="/visits-calendar">
                  <Calendar className="mr-2 h-4 w-4" />
                  View Visits Calendar
                </a>
              </Button>
              <Button variant="outline" className="justify-start bg-transparent" asChild>
                <a href="/homes-map">
                  <MapPin className="mr-2 h-4 w-4" />
                  View Homes Map
                </a>
              </Button>
              <Button variant="outline" className="justify-start bg-transparent" asChild>
                <a href="/homes-list">
                  <Users className="mr-2 h-4 w-4" />
                  Browse Homes List
                </a>
              </Button>
              <Button variant="outline" className="justify-start bg-transparent" asChild>
                <a href="/reports">
                  <BarChart3 className="mr-2 h-4 w-4" />
                  Generate Reports
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
