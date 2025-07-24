"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Home, Map, User, CheckCircle, BarChart3, Shield, ExternalLink } from "lucide-react"
import Link from "next/link"
import { useUser } from "@clerk/nextjs"
import { MICROSERVICE_CONFIG } from "@/lib/microservice-config"

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
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-48 bg-refuge-gray rounded"></div>
            <div className="h-48 bg-refuge-gray rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Welcome Message */}
      <div className="bg-gradient-to-r from-refuge-purple to-refuge-magenta p-6 rounded-lg text-white">
        <p className="text-lg font-medium">Welcome to {MICROSERVICE_CONFIG.name}</p>
        <p className="text-refuge-gray/90 mt-1">
          Welcome back, {user?.firstName || "User"} - {MICROSERVICE_CONFIG.description}
        </p>
      </div>

      {/* Main Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Foster Homes List */}
        <Card className="border-refuge-light-purple/20 hover:shadow-lg hover:shadow-refuge-purple/10 transition-all duration-200">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-refuge-purple to-refuge-light-purple rounded-lg">
                <Home className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl text-refuge-dark-blue">Foster Homes List</CardTitle>
                <CardDescription className="text-refuge-dark-blue/70">
                  View detailed information about all active foster homes in the system
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-refuge-dark-blue/80">Browse homes, contact information, case managers, and more</p>
            <Link href="/homes-list">
              <Button className="w-full sm:w-auto bg-gradient-to-r from-refuge-purple to-refuge-light-purple hover:from-refuge-purple/90 hover:to-refuge-light-purple/90 text-white border-0">
                View Access
                <ExternalLink className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Geographic Map */}
        <Card className="border-refuge-magenta/20 hover:shadow-lg hover:shadow-refuge-magenta/10 transition-all duration-200">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-refuge-magenta to-red-500 rounded-lg">
                <Map className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl text-refuge-dark-blue">Geographic Map</CardTitle>
                <CardDescription className="text-refuge-dark-blue/70">
                  Interactive map showing the geographic locations of foster homes
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-refuge-dark-blue/80">Visual map with filtering, search, and detailed home information</p>
            <Link href="/homes-map">
              <Button className="w-full sm:w-auto bg-gradient-to-r from-refuge-magenta to-red-500 hover:from-refuge-magenta/90 hover:to-red-500/90 text-white border-0">
                View Access
                <ExternalLink className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Account Status */}
      <Card className="border-refuge-light-purple/30 bg-gradient-to-br from-white to-refuge-gray/30">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-refuge-light-purple to-refuge-purple rounded-lg">
              <User className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl text-refuge-dark-blue">Your Account Status</CardTitle>
              <CardDescription className="text-refuge-dark-blue/70">
                Current permissions and access level in {MICROSERVICE_CONFIG.name}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-lg border border-refuge-light-purple/20 shadow-sm">
              <div className="text-center">
                <p className="text-sm font-medium text-refuge-dark-blue/70 mb-1">Email Domain</p>
                <p className="text-lg font-semibold text-refuge-dark-blue">
                  {user?.primaryEmailAddress?.emailAddress?.split("@")[1] || "refugehouse.org"}
                </p>
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg border border-refuge-light-purple/20 shadow-sm">
              <div className="text-center">
                <p className="text-sm font-medium text-refuge-dark-blue/70 mb-1">Account Status</p>
                <Badge className="bg-green-100 text-green-800 border-green-200">Active</Badge>
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg border border-refuge-light-purple/20 shadow-sm">
              <div className="text-center">
                <p className="text-sm font-medium text-refuge-dark-blue/70 mb-1">Assigned Roles</p>
                <p className="text-lg font-semibold text-refuge-dark-blue">{dashboardData?.userRoles?.length || 1}</p>
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg border border-refuge-light-purple/20 shadow-sm">
              <div className="text-center">
                <p className="text-sm font-medium text-refuge-dark-blue/70 mb-1">Permissions</p>
                <p className="text-lg font-semibold text-refuge-dark-blue">
                  {dashboardData?.userPermissions?.length || 6}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Default Access Level */}
      <Card className="border-refuge-purple/20 bg-gradient-to-br from-refuge-gray/20 to-white">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-lg">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl text-refuge-dark-blue">Default Access Level</CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-refuge-dark-blue/80">
            As a {user?.primaryEmailAddress?.emailAddress?.split("@")[1] || "refugehouse.org"} domain user, you have
            default access to view foster homes information:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span className="text-refuge-dark-blue/80">View foster homes list and details</span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span className="text-refuge-dark-blue/80">Access interactive geographic map</span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span className="text-refuge-dark-blue/80">Filter and search home information</span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span className="text-refuge-dark-blue/80">View case manager contact details</span>
            </div>
          </div>

          <div className="mt-6 p-4 bg-white rounded-lg border border-refuge-light-purple/20 shadow-sm">
            <h4 className="font-medium text-refuge-dark-blue mb-2">Additional Role-Based Access:</h4>
            <div className="flex items-center gap-2">
              <input
                type="radio"
                id="admin-role"
                name="additional-access"
                className="text-refuge-purple"
                disabled
                checked={dashboardData?.userRoles?.includes("admin") || false}
              />
              <label htmlFor="admin-role" className="text-refuge-dark-blue/80">
                admin in {MICROSERVICE_CONFIG.name}
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-refuge-light-purple/20 text-center bg-gradient-to-br from-white to-refuge-light-purple/5">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center space-y-2">
              <div className="p-3 bg-gradient-to-br from-refuge-light-purple to-refuge-purple rounded-full">
                <BarChart3 className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-refuge-dark-blue">Active</h3>
              <p className="text-sm text-refuge-dark-blue/70">System Status</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-refuge-magenta/20 text-center bg-gradient-to-br from-white to-refuge-magenta/5">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center space-y-2">
              <div className="p-3 bg-gradient-to-br from-refuge-magenta to-red-500 rounded-full">
                <Home className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-refuge-dark-blue">Ready</h3>
              <p className="text-sm text-refuge-dark-blue/70">Data Access</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200 text-center bg-gradient-to-br from-white to-green-50">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center space-y-2">
              <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-full">
                <CheckCircle className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-refuge-dark-blue">Authorized</h3>
              <p className="text-sm text-refuge-dark-blue/70">User Status</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
