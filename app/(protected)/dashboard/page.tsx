"use client"

import { useEffect, useState } from "react"
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="animate-pulse space-y-8">
          <div className="h-32 bg-slate-200 dark:bg-slate-700 rounded-xl"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-64 bg-slate-200 dark:bg-slate-700 rounded-xl"></div>
            <div className="h-64 bg-slate-200 dark:bg-slate-700 rounded-xl"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8 bg-slate-50 dark:bg-slate-950 min-h-screen">
      {/* Welcome Banner - Modern Soft Design */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="bg-gradient-to-br from-refuge-purple/10 via-transparent to-refuge-magenta/10 p-8 border-l-4 border-refuge-purple">
          <h1 className="text-3xl md:text-4xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
            Welcome to Home Visits Application
          </h1>
          <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
            Welcome back, {user?.firstName || "User"} - Foster care home visit scheduling and management
          </p>
        </div>
      </div>

      {/* Main Action Cards - Modern Card Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Foster Homes List */}
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 hover:border-refuge-purple/20">
          <div className="flex items-start gap-4 mb-6">
            <div className="p-3 bg-refuge-purple/10 dark:bg-refuge-purple/20 rounded-xl">
              <Home className="h-6 w-6 text-refuge-purple dark:text-refuge-light-purple" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">Foster Homes List</h3>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                View detailed information about all active foster homes in the system
              </p>
            </div>
          </div>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            Browse homes, contact information, case managers, and more
          </p>
          <Link href="/homes-list">
            <button className="px-4 py-2 bg-refuge-purple hover:bg-refuge-purple/90 text-white font-medium rounded-lg transition-all duration-200 active:scale-95 transform shadow-sm hover:shadow-md inline-flex items-center gap-2">
              View Access
              <ExternalLink className="h-4 w-4" />
            </button>
          </Link>
        </div>

        {/* Geographic Map */}
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 hover:border-refuge-magenta/20">
          <div className="flex items-start gap-4 mb-6">
            <div className="p-3 bg-refuge-magenta/10 dark:bg-refuge-magenta/20 rounded-xl">
              <Map className="h-6 w-6 text-refuge-magenta dark:text-red-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">Geographic Map</h3>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                Interactive map showing the geographic locations of foster homes
              </p>
            </div>
          </div>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            Visual map with filtering, search, and detailed home information
          </p>
          <Link href="/homes-map">
            <button className="px-4 py-2 bg-refuge-magenta hover:bg-refuge-magenta/90 text-white font-medium rounded-lg transition-all duration-200 active:scale-95 transform shadow-sm hover:shadow-md inline-flex items-center gap-2">
              View Access
              <ExternalLink className="h-4 w-4" />
            </button>
          </Link>
        </div>
      </div>

      {/* Account Status - Modern Layout */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
        <div className="flex items-start gap-4 mb-6">
          <div className="p-3 bg-sky-100 dark:bg-sky-900/30 rounded-xl">
            <User className="h-6 w-6 text-sky-600 dark:text-sky-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">Your Account Status</h3>
            <p className="text-slate-600 dark:text-slate-400">Current permissions and access level</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg text-center border border-slate-200 dark:border-slate-700">
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">Email Domain</p>
            <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              {user?.primaryEmailAddress?.emailAddress?.split("@")[1] || "refugehouse.org"}
            </p>
          </div>
          <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg text-center border border-slate-200 dark:border-slate-700">
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">Account Status</p>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300">
              Active
            </span>
          </div>
          <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg text-center border border-slate-200 dark:border-slate-700">
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">Assigned Roles</p>
            <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              {dashboardData?.userRoles?.length || 1}
            </p>
          </div>
          <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg text-center border border-slate-200 dark:border-slate-700">
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">Permissions</p>
            <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              {dashboardData?.userPermissions?.length || 6}
            </p>
          </div>
        </div>
      </div>

      {/* Default Access Level */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
        <div className="flex items-start gap-4 mb-6">
          <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
            <Shield className="h-6 w-6 text-green-600 dark:text-green-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">Default Access Level</h3>
          </div>
        </div>

        <div className="space-y-6">
          <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
            As a {user?.primaryEmailAddress?.emailAddress?.split("@")[1] || "refugehouse.org"} domain user, you have
            default access to view foster homes information:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0" />
              <span className="text-slate-600 dark:text-slate-400">View foster homes list and details</span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0" />
              <span className="text-slate-600 dark:text-slate-400">Access interactive geographic map</span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0" />
              <span className="text-slate-600 dark:text-slate-400">Filter and search home information</span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0" />
              <span className="text-slate-600 dark:text-slate-400">View case manager contact details</span>
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-lg border border-slate-200 dark:border-slate-700">
            <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-4">Additional Role-Based Access:</h4>
            <div className="flex items-center gap-3">
              <input
                type="radio"
                id="admin-role"
                name="additional-access"
                className="w-4 h-4 text-refuge-purple bg-white dark:bg-slate-900 border-slate-300 rounded focus:ring-refuge-purple focus:ring-2"
                disabled
                checked={dashboardData?.userRoles?.includes("admin") || false}
              />
              <label htmlFor="admin-role" className="text-slate-600 dark:text-slate-400">
                admin in Home Visits Application
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* System Status Cards - Modern Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 text-center">
          <div className="flex flex-col items-center space-y-4">
            <div className="p-4 bg-sky-100 dark:bg-sky-900/30 rounded-xl">
              <BarChart3 className="h-8 w-8 text-sky-600 dark:text-sky-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Active</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">System Status</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 text-center">
          <div className="flex flex-col items-center space-y-4">
            <div className="p-4 bg-refuge-purple/10 dark:bg-refuge-purple/20 rounded-xl">
              <Home className="h-8 w-8 text-refuge-purple dark:text-refuge-light-purple" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Ready</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Data Access</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 text-center">
          <div className="flex flex-col items-center space-y-4">
            <div className="p-4 bg-green-100 dark:bg-green-900/30 rounded-xl">
              <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Authorized</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">User Status</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
