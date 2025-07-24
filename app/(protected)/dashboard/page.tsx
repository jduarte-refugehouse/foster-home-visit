"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Home, Map, User, CheckCircle, BarChart3, Shield, ExternalLink } from "lucide-react"
import Link from "next/link"
import { useUser } from "@clerk/nextjs"

export const dynamic = "force-dynamic"

interface DashboardData {
  totalHomes: number
  activeHomes: number
  totalUsers: number
  systemStatus: string
  userPermissions: string[]
  userRoles: string[]
}

export default function DashboardPage() {
  const { user } = useUser()
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

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

  if (loading) {
    return (
      <div className="refuge-page">
        <div className="animate-pulse space-y-8">
          <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
            <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="refuge-page">
      {/* Welcome Banner */}
      <Card className="refuge-card overflow-hidden">
        <div className="refuge-banner">
          <h1 className="refuge-banner-title">Welcome to Home Visits Application</h1>
          <p className="refuge-banner-subtitle">
            Welcome back, {user?.firstName || "User"} - Foster care home visit scheduling and management
          </p>
        </div>
      </Card>

      {/* Main Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Foster Homes List */}
        <Card className="refuge-card refuge-card-hover">
          <CardHeader className="p-6">
            <div className="flex items-start gap-4">
              <div className="refuge-icon-primary">
                <Home className="h-6 w-6 text-refuge-purple-700 dark:text-refuge-purple-300" />
              </div>
              <div className="flex-1">
                <CardTitle className="refuge-heading mb-2">Foster Homes List</CardTitle>
                <CardDescription className="refuge-subheading leading-relaxed">
                  View detailed information about all active foster homes in the system
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 pt-0">
            <p className="refuge-body mb-6">Browse homes, contact information, case managers, and more</p>
            <Link href="/homes-list">
              <Button className="refuge-btn-primary">
                View Access
                <ExternalLink className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Geographic Map */}
        <Card className="refuge-card refuge-card-hover">
          <CardHeader className="p-6">
            <div className="flex items-start gap-4">
              <div className="refuge-icon-secondary">
                <Map className="h-6 w-6 text-refuge-magenta-700 dark:text-refuge-magenta-300" />
              </div>
              <div className="flex-1">
                <CardTitle className="refuge-heading mb-2">Geographic Map</CardTitle>
                <CardDescription className="refuge-subheading leading-relaxed">
                  Interactive map showing the geographic locations of foster homes
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 pt-0">
            <p className="refuge-body mb-6">Visual map with filtering, search, and detailed home information</p>
            <Link href="/homes-map">
              <Button className="refuge-btn-secondary">
                View Access
                <ExternalLink className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Account Status */}
      <Card className="refuge-card">
        <CardHeader className="p-6">
          <div className="flex items-start gap-4">
            <div className="refuge-icon-info">
              <User className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1">
              <CardTitle className="refuge-heading mb-2">Your Account Status</CardTitle>
              <CardDescription className="refuge-subheading">Current permissions and access level</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6 pt-0">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="refuge-status-card">
              <p className="refuge-caption mb-2">Email Domain</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {user?.primaryEmailAddress?.emailAddress?.split("@")[1] || "refugehouse.org"}
              </p>
            </div>
            <div className="refuge-status-card">
              <p className="refuge-caption mb-2">Account Status</p>
              <Badge className="bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300 border-0 rounded-lg px-3 py-1">
                Active
              </Badge>
            </div>
            <div className="refuge-status-card">
              <p className="refuge-caption mb-2">Assigned Roles</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {dashboardData?.userRoles?.length || 1}
              </p>
            </div>
            <div className="refuge-status-card">
              <p className="refuge-caption mb-2">Permissions</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {dashboardData?.userPermissions?.length || 6}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Default Access Level */}
      <Card className="refuge-card">
        <CardHeader className="p-6">
          <div className="flex items-start gap-4">
            <div className="refuge-icon-success">
              <Shield className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="flex-1">
              <CardTitle className="refuge-heading mb-2">Default Access Level</CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6 pt-0 space-y-6">
          <p className="refuge-body">
            As a {user?.primaryEmailAddress?.emailAddress?.split("@")[1] || "refugehouse.org"} domain user, you have
            default access to view foster homes information:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0" />
              <span className="refuge-body">View foster homes list and details</span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0" />
              <span className="refuge-body">Access interactive geographic map</span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0" />
              <span className="refuge-body">Filter and search home information</span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0" />
              <span className="refuge-body">View case manager contact details</span>
            </div>
          </div>

          <div className="refuge-status-card text-left">
            <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Additional Role-Based Access:</h4>
            <div className="flex items-center gap-3">
              <input
                type="radio"
                id="admin-role"
                name="additional-access"
                className="text-refuge-purple-600 focus:ring-refuge-purple-500"
                disabled
                checked={dashboardData?.userRoles?.includes("admin") || false}
              />
              <label htmlFor="admin-role" className="refuge-body">
                admin in Home Visits Application
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="refuge-card text-center">
          <CardContent className="p-6">
            <div className="flex flex-col items-center space-y-4">
              <div className="refuge-icon-info">
                <BarChart3 className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Active</h3>
                <p className="refuge-caption mt-1">System Status</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="refuge-card text-center">
          <CardContent className="p-6">
            <div className="flex flex-col items-center space-y-4">
              <div className="refuge-icon-primary">
                <Home className="h-8 w-8 text-refuge-purple-700 dark:text-refuge-purple-300" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Ready</h3>
                <p className="refuge-caption mt-1">Data Access</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="refuge-card text-center">
          <CardContent className="p-6">
            <div className="flex flex-col items-center space-y-4">
              <div className="refuge-icon-success">
                <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Authorized</h3>
                <p className="refuge-caption mt-1">User Status</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
