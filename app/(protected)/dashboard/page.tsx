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
      <div className="p-8">
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
    <div className="p-8 space-y-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Welcome Banner - More Subtle */}
      <Card className="border-0 shadow-lg rounded-xl overflow-hidden">
        <div className="bg-gradient-to-r from-refuge-purple/20 to-refuge-magenta/20 dark:from-refuge-purple/30 dark:to-refuge-magenta/30 border border-refuge-purple/20 dark:border-refuge-purple/30 p-8">
          <h1 className="text-2xl font-semibold mb-2 text-refuge-purple dark:text-refuge-light-purple">
            Welcome to Home Visits Application
          </h1>
          <p className="text-refuge-dark-blue/80 dark:text-gray-300">
            Welcome back, {user?.firstName || "User"} - Foster care home visit scheduling and management
          </p>
        </div>
      </Card>

      {/* Main Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Foster Homes List */}
        <Card className="border-0 shadow-lg rounded-xl hover:shadow-xl transition-all duration-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <CardHeader className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-refuge-purple/10 dark:bg-refuge-purple/20 rounded-xl">
                <Home className="h-6 w-6 text-refuge-purple dark:text-refuge-light-purple" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-xl text-gray-900 dark:text-gray-100 mb-2">Foster Homes List</CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  View detailed information about all active foster homes in the system
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 pt-0">
            <p className="text-gray-700 dark:text-gray-300 mb-6">
              Browse homes, contact information, case managers, and more
            </p>
            <Link href="/homes-list">
              <Button className="bg-refuge-purple/80 hover:bg-refuge-purple dark:bg-refuge-purple/70 dark:hover:bg-refuge-purple/90 text-white rounded-lg px-6 py-2.5 font-medium transition-colors duration-200 shadow-sm">
                View Access
                <ExternalLink className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Geographic Map */}
        <Card className="border-0 shadow-lg rounded-xl hover:shadow-xl transition-all duration-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <CardHeader className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-refuge-magenta/10 dark:bg-refuge-magenta/20 rounded-xl">
                <Map className="h-6 w-6 text-refuge-magenta dark:text-red-400" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-xl text-gray-900 dark:text-gray-100 mb-2">Geographic Map</CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  Interactive map showing the geographic locations of foster homes
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 pt-0">
            <p className="text-gray-700 dark:text-gray-300 mb-6">
              Visual map with filtering, search, and detailed home information
            </p>
            <Link href="/homes-map">
              <Button className="bg-refuge-magenta/80 hover:bg-refuge-magenta dark:bg-refuge-magenta/70 dark:hover:bg-refuge-magenta/90 text-white rounded-lg px-6 py-2.5 font-medium transition-colors duration-200 shadow-sm">
                View Access
                <ExternalLink className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Account Status */}
      <Card className="border-0 shadow-lg rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
        <CardHeader className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-xl">
              <User className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-xl text-gray-900 dark:text-gray-100 mb-2">Your Account Status</CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                Current permissions and access level
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6 pt-0">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl text-center border border-gray-200 dark:border-gray-600">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Email Domain</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {user?.primaryEmailAddress?.emailAddress?.split("@")[1] || "refugehouse.org"}
              </p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl text-center border border-gray-200 dark:border-gray-600">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Account Status</p>
              <Badge className="bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300 border-0 rounded-lg px-3 py-1">
                Active
              </Badge>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl text-center border border-gray-200 dark:border-gray-600">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Assigned Roles</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {dashboardData?.userRoles?.length || 1}
              </p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl text-center border border-gray-200 dark:border-gray-600">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Permissions</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {dashboardData?.userPermissions?.length || 6}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Default Access Level */}
      <Card className="border-0 shadow-lg rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
        <CardHeader className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-green-50 dark:bg-green-900/30 rounded-xl">
              <Shield className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-xl text-gray-900 dark:text-gray-100 mb-2">Default Access Level</CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6 pt-0 space-y-6">
          <p className="text-gray-700 dark:text-gray-300">
            As a {user?.primaryEmailAddress?.emailAddress?.split("@")[1] || "refugehouse.org"} domain user, you have
            default access to view foster homes information:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0" />
              <span className="text-gray-700 dark:text-gray-300">View foster homes list and details</span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0" />
              <span className="text-gray-700 dark:text-gray-300">Access interactive geographic map</span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0" />
              <span className="text-gray-700 dark:text-gray-300">Filter and search home information</span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0" />
              <span className="text-gray-700 dark:text-gray-300">View case manager contact details</span>
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-700/50 p-6 rounded-xl border border-gray-200 dark:border-gray-600">
            <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Additional Role-Based Access:</h4>
            <div className="flex items-center gap-3">
              <input
                type="radio"
                id="admin-role"
                name="additional-access"
                className="text-refuge-purple focus:ring-refuge-purple dark:text-refuge-light-purple dark:focus:ring-refuge-light-purple"
                disabled
                checked={dashboardData?.userRoles?.includes("admin") || false}
              />
              <label htmlFor="admin-role" className="text-gray-700 dark:text-gray-300">
                admin in Home Visits Application
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-0 shadow-lg rounded-xl bg-white dark:bg-gray-800 text-center border border-gray-200 dark:border-gray-700">
          <CardContent className="p-6">
            <div className="flex flex-col items-center space-y-4">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/30 rounded-xl">
                <BarChart3 className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Active</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">System Status</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg rounded-xl bg-white dark:bg-gray-800 text-center border border-gray-200 dark:border-gray-700">
          <CardContent className="p-6">
            <div className="flex flex-col items-center space-y-4">
              <div className="p-4 bg-refuge-purple/10 dark:bg-refuge-purple/20 rounded-xl">
                <Home className="h-8 w-8 text-refuge-purple dark:text-refuge-light-purple" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Ready</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Data Access</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg rounded-xl bg-white dark:bg-gray-800 text-center border border-gray-200 dark:border-gray-700">
          <CardContent className="p-6">
            <div className="flex flex-col items-center space-y-4">
              <div className="p-4 bg-green-50 dark:bg-green-900/30 rounded-xl">
                <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Authorized</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">User Status</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
