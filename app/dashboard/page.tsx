"use client"

import { useState, useEffect } from "react"
import { useUser } from "@clerk/nextjs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Home,
  Calendar,
  FileText,
  Users,
  MapPin,
  Clock,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  Activity,
  Lock,
  ArrowRight,
  Plus,
} from "lucide-react"
import Link from "next/link"

interface DashboardStats {
  totalHomes: number
  activeVisits: number
  pendingReports: number
  completedThisMonth: number
  overdueItems: number
}

interface RecentActivity {
  id: string
  type: "visit" | "report" | "assessment"
  description: string
  timestamp: string
  status: "completed" | "pending" | "overdue"
}

interface UpcomingTask {
  id: string
  title: string
  type: "visit" | "report" | "assessment"
  dueDate: string
  priority: "high" | "medium" | "low"
  family: string
}

export default function DashboardPage() {
  const { isSignedIn, isLoaded, user } = useUser()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [upcomingTasks, setUpcomingTasks] = useState<UpcomingTask[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isSignedIn) {
      // Simulate loading dashboard data
      setTimeout(() => {
        setStats({
          totalHomes: 127,
          activeVisits: 23,
          pendingReports: 8,
          completedThisMonth: 89,
          overdueItems: 5,
        })

        setRecentActivity([
          {
            id: "1",
            type: "visit",
            description: "Completed home visit for Johnson Family",
            timestamp: "2 hours ago",
            status: "completed",
          },
          {
            id: "2",
            type: "report",
            description: "Assessment report submitted for Smith Family",
            timestamp: "4 hours ago",
            status: "completed",
          },
          {
            id: "3",
            type: "visit",
            description: "Scheduled follow-up visit for Davis Family",
            timestamp: "1 day ago",
            status: "pending",
          },
          {
            id: "4",
            type: "assessment",
            description: "Initial assessment for Wilson Family",
            timestamp: "2 days ago",
            status: "completed",
          },
        ])

        setUpcomingTasks([
          {
            id: "1",
            title: "Home Safety Assessment",
            type: "assessment",
            dueDate: "Tomorrow",
            priority: "high",
            family: "Martinez Family",
          },
          {
            id: "2",
            title: "Monthly Check-in Visit",
            type: "visit",
            dueDate: "Jan 25",
            priority: "medium",
            family: "Thompson Family",
          },
          {
            id: "3",
            title: "Quarterly Report",
            type: "report",
            dueDate: "Jan 28",
            priority: "medium",
            family: "Anderson Family",
          },
          {
            id: "4",
            title: "Follow-up Assessment",
            type: "assessment",
            dueDate: "Jan 30",
            priority: "low",
            family: "Garcia Family",
          },
        ])

        setLoading(false)
      }, 1000)
    }
  }, [isSignedIn])

  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
          <div className="text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
            <p className="text-gray-600">Loading dashboard...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!isSignedIn) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
          <Card className="w-full max-w-md">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Lock className="h-12 w-12 text-gray-400 mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Authentication Required</h2>
              <p className="text-gray-600 text-center mb-6">You need to be signed in to access the dashboard.</p>
              <Link href="/">
                <Button>Go to Home</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "visit":
        return <MapPin className="h-4 w-4" />
      case "report":
        return <FileText className="h-4 w-4" />
      case "assessment":
        return <CheckCircle className="h-4 w-4" />
      default:
        return <Activity className="h-4 w-4" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "text-green-600"
      case "pending":
        return "text-yellow-600"
      case "overdue":
        return "text-red-600"
      default:
        return "text-gray-600"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800"
      case "medium":
        return "bg-yellow-100 text-yellow-800"
      case "low":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome back, {user?.firstName}!</h1>
          <p className="text-gray-600">Here's what's happening with your foster home visits today.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Homes</p>
                  <p className="text-2xl font-bold text-gray-900">{stats?.totalHomes}</p>
                </div>
                <Home className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Visits</p>
                  <p className="text-2xl font-bold text-gray-900">{stats?.activeVisits}</p>
                </div>
                <Calendar className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending Reports</p>
                  <p className="text-2xl font-bold text-gray-900">{stats?.pendingReports}</p>
                </div>
                <FileText className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Completed This Month</p>
                  <p className="text-2xl font-bold text-gray-900">{stats?.completedThisMonth}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Overdue Items</p>
                  <p className="text-2xl font-bold text-gray-900">{stats?.overdueItems}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Recent Activity */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Recent Activity
              </CardTitle>
              <CardDescription>Latest updates from your foster home visits and assessments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50">
                    <div className={`p-1 rounded ${getStatusColor(activity.status)}`}>
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{activity.description}</p>
                      <p className="text-xs text-gray-500">{activity.timestamp}</p>
                    </div>
                    <Badge variant="outline" className={getStatusColor(activity.status)}>
                      {activity.status}
                    </Badge>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t">
                <Button variant="outline" className="w-full bg-transparent">
                  View All Activity
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Upcoming Tasks */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Upcoming Tasks
              </CardTitle>
              <CardDescription>Your scheduled visits and pending work</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {upcomingTasks.map((task) => (
                  <div key={task.id} className="p-3 rounded-lg border">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="text-sm font-medium text-gray-900">{task.title}</h4>
                      <Badge className={getPriorityColor(task.priority)} variant="secondary">
                        {task.priority}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-600 mb-1">{task.family}</p>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      {getActivityIcon(task.type)}
                      <span>Due {task.dueDate}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t">
                <Button variant="outline" className="w-full bg-transparent">
                  <Plus className="mr-2 h-4 w-4" />
                  Schedule New Visit
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks and frequently used features</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Link href="/homes-map" prefetch={false}>
                <Button variant="outline" className="w-full h-20 flex flex-col gap-2 bg-transparent">
                  <MapPin className="h-6 w-6" />
                  <span className="text-sm">View Map</span>
                </Button>
              </Link>

              <Link href="/homes-list" prefetch={false}>
                <Button variant="outline" className="w-full h-20 flex flex-col gap-2 bg-transparent">
                  <Users className="h-6 w-6" />
                  <span className="text-sm">Browse Homes</span>
                </Button>
              </Link>

              <Button variant="outline" className="w-full h-20 flex flex-col gap-2 bg-transparent">
                <Plus className="h-6 w-6" />
                <span className="text-sm">New Visit</span>
              </Button>

              <Button variant="outline" className="w-full h-20 flex flex-col gap-2 bg-transparent">
                <FileText className="h-6 w-6" />
                <span className="text-sm">Create Report</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Performance Overview */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Monthly Performance
            </CardTitle>
            <CardDescription>Your progress towards monthly goals</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Visits Completed</span>
                  <span>89 / 100</span>
                </div>
                <Progress value={89} className="h-2" />
              </div>

              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Reports Submitted</span>
                  <span>76 / 85</span>
                </div>
                <Progress value={89} className="h-2" />
              </div>

              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Assessments Completed</span>
                  <span>23 / 30</span>
                </div>
                <Progress value={77} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
