"use client"

import { useState, useEffect } from "react"
import { useUser } from "@clerk/nextjs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Home, Map, Users, Shield, ExternalLink } from "lucide-react"

interface DashboardData {
  totalHomes: number
  activeCaseManagers: number
  recentActivity: string
  systemStatus: "healthy" | "warning" | "error"
}

export default function DashboardPage() {
  const { user } = useUser()
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

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
    fetchDashboardData()
  }, [])

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
