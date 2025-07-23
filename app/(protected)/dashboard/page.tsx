"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Home, Map, User, CheckCircle, BarChart3, Shield, ExternalLink } from "lucide-react"
import Link from "next/link"
import { useUser } from "@clerk/nextjs"

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
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Home Visits Service</h1>
        <p className="text-gray-600 dark:text-gray-300">Welcome, {user?.firstName || "User"}</p>
      </div>

      <Separator className="dark:border-gray-700" />

      {/* Main Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Foster Homes List */}
        <Card className="dark:bg-gray-800 dark:border-gray-700 hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Home className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <CardTitle className="text-xl text-gray-900 dark:text-gray-100">Foster Homes List</CardTitle>
                <CardDescription className="dark:text-gray-400">
                  View detailed information about all active foster homes in the system
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600 dark:text-gray-300">
              Browse homes, contact information, case managers, and more
            </p>
            <Link href="/homes-list">
              <Button className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700">
                View Access
                <ExternalLink className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Geographic Map */}
        <Card className="dark:bg-gray-800 dark:border-gray-700 hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                <Map className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <CardTitle className="text-xl text-gray-900 dark:text-gray-100">Geographic Map</CardTitle>
                <CardDescription className="dark:text-gray-400">
                  Interactive map showing the geographic locations of foster homes
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600 dark:text-gray-300">
              Visual map with filtering, search, and detailed home information
            </p>
            <Link href="/homes-map">
              <Button className="w-full sm:w-auto bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700">
                View Access
                <ExternalLink className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Account Status */}
      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <User className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <CardTitle className="text-xl text-gray-900 dark:text-gray-100">Your Account Status</CardTitle>
              <CardDescription className="dark:text-gray-400">Current permissions and access level</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-gray-700 p-4 rounded-lg border dark:border-gray-600">
              <div className="text-center">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Email Domain</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {user?.primaryEmailAddress?.emailAddress?.split("@")[1] || "refugehouse.org"}
                </p>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-700 p-4 rounded-lg border dark:border-gray-600">
              <div className="text-center">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Account Status</p>
                <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800">
                  Active
                </Badge>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-700 p-4 rounded-lg border dark:border-gray-600">
              <div className="text-center">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Assigned Roles</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {dashboardData?.userRoles?.length || 1}
                </p>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-700 p-4 rounded-lg border dark:border-gray-600">
              <div className="text-center">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Permissions</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {dashboardData?.userPermissions?.length || 6}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Default Access Level */}
      <Card className="dark:bg-gray-700 dark:border-gray-600">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <Shield className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <CardTitle className="text-xl text-gray-900 dark:text-gray-100">Default Access Level</CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-700 dark:text-gray-300">
            As a {user?.primaryEmailAddress?.emailAddress?.split("@")[1] || "refugehouse.org"} domain user, you have
            default access to view foster homes information:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span className="text-gray-700 dark:text-gray-300">View foster homes list and details</span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span className="text-gray-700 dark:text-gray-300">Access interactive geographic map</span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span className="text-gray-700 dark:text-gray-300">Filter and search home information</span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span className="text-gray-700 dark:text-gray-300">View case manager contact details</span>
            </div>
          </div>

          <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border dark:border-gray-600">
            <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Additional Role-Based Access:</h4>
            <div className="flex items-center gap-2">
              <input
                type="radio"
                id="admin-role"
                name="additional-access"
                className="text-blue-600"
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
        <Card className="dark:bg-gray-800 dark:border-gray-700 text-center">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center space-y-2">
              <BarChart3 className="h-8 w-8 text-purple-500" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Active</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">System Status</p>
            </div>
          </CardContent>
        </Card>

        <Card className="dark:bg-gray-800 dark:border-gray-700 text-center">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center space-y-2">
              <Home className="h-8 w-8 text-red-500" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Ready</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Data Access</p>
            </div>
          </CardContent>
        </Card>

        <Card className="dark:bg-gray-800 dark:border-gray-700 text-center">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center space-y-2">
              <CheckCircle className="h-8 w-8 text-green-500" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Authorized</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">User Status</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
