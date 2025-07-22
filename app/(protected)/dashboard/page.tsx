"use client"

import { useUser } from "@clerk/nextjs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowLeft, User, Shield, CheckCircle, AlertCircle, Home, Map, List, BarChart3 } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"

interface AppUser {
  id: string
  clerk_user_id: string
  email: string
  first_name: string
  last_name: string
  is_active: boolean
  created_at: string
  updated_at: string
}

interface UserRole {
  role_name: string
  app_name: string
}

interface UserPermission {
  permission_code: string
  permission_name: string
  app_name: string
}

interface UserInfoResponse {
  appUser: AppUser
  roles: UserRole[]
  permissions: UserPermission[]
}

export default function DashboardPage() {
  const { user } = useUser()
  const [userInfo, setUserInfo] = useState<UserInfoResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      fetchUserInfo()
    }
  }, [user])

  const fetchUserInfo = async () => {
    if (!user) return

    try {
      const response = await fetch("/api/auth-test/user-info", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          clerkUserId: user.id,
          email: user.primaryEmailAddress?.emailAddress,
          firstName: user.firstName,
          lastName: user.lastName,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to fetch user info")
      }

      const data = await response.json()
      setUserInfo(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-refuge-gray dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-refuge-purple"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-refuge-gray dark:bg-gray-900 p-4">
        <div className="max-w-4xl mx-auto">
          <Card className="border-red-200 dark:border-red-800">
            <CardContent className="py-6">
              <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
                <AlertCircle className="h-5 w-5" />
                <span className="font-medium">Error: {error}</span>
              </div>
              <div className="mt-4">
                <Link href="/">
                  <Button variant="outline">Back to Login</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-refuge-gray dark:bg-gray-900 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-3xl bg-gradient-to-r from-refuge-purple to-refuge-magenta bg-clip-text text-transparent">
                  Home Visits Service
                </CardTitle>
                <CardDescription className="text-lg mt-2 text-gray-600 dark:text-gray-300">
                  Welcome, {userInfo?.appUser.first_name} {userInfo?.appUser.last_name}
                </CardDescription>
              </div>
              <Link href="/">
                <Button
                  variant="outline"
                  className="border-refuge-purple text-refuge-purple hover:bg-refuge-purple hover:text-white bg-transparent dark:border-refuge-light-purple dark:text-refuge-light-purple dark:hover:bg-refuge-light-purple dark:hover:text-gray-900"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Login
                </Button>
              </Link>
            </div>
          </CardHeader>
        </Card>

        {/* Main Navigation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Homes List Card */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer group dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-750">
            <Link href="/homes-list">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-refuge-purple group-hover:text-refuge-magenta transition-colors dark:text-refuge-light-purple dark:group-hover:text-refuge-magenta">
                  <List className="h-6 w-6" />
                  Foster Homes List
                </CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-300">
                  View detailed information about all active foster homes in the system
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Browse homes, contact information, case managers, and more
                  </div>
                  <Badge
                    variant="outline"
                    className="border-refuge-purple text-refuge-purple dark:border-refuge-light-purple dark:text-refuge-light-purple"
                  >
                    View Access
                  </Badge>
                </div>
              </CardContent>
            </Link>
          </Card>

          {/* Homes Map Card */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer group dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-750">
            <Link href="/homes-map">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-refuge-purple group-hover:text-refuge-magenta transition-colors dark:text-refuge-light-purple dark:group-hover:text-refuge-magenta">
                  <Map className="h-6 w-6" />
                  Geographic Map
                </CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-300">
                  Interactive map showing the geographic locations of foster homes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Visual map with filtering, search, and detailed home information
                  </div>
                  <Badge
                    variant="outline"
                    className="border-refuge-purple text-refuge-purple dark:border-refuge-light-purple dark:text-refuge-light-purple"
                  >
                    View Access
                  </Badge>
                </div>
              </CardContent>
            </Link>
          </Card>
        </div>

        {/* User Status Summary */}
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-refuge-purple dark:text-refuge-light-purple">
              <User className="h-5 w-5" />
              Your Account Status
            </CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-300">
              Current permissions and access level
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-white dark:bg-gray-700 rounded-lg border dark:border-gray-600">
                <p className="text-sm text-gray-600 dark:text-gray-400">Email Domain</p>
                <p className="font-medium text-refuge-dark-blue dark:text-gray-200">
                  {userInfo?.appUser.email?.includes("@refugehouse.org") ? "refugehouse.org" : "External"}
                </p>
              </div>
              <div className="text-center p-4 bg-white dark:bg-gray-700 rounded-lg border dark:border-gray-600">
                <p className="text-sm text-gray-600 dark:text-gray-400">Account Status</p>
                <Badge
                  variant={userInfo?.appUser.is_active ? "default" : "secondary"}
                  className="dark:bg-green-600 dark:text-white"
                >
                  {userInfo?.appUser.is_active ? "Active" : "Inactive"}
                </Badge>
              </div>
              <div className="text-center p-4 bg-white dark:bg-gray-700 rounded-lg border dark:border-gray-600">
                <p className="text-sm text-gray-600 dark:text-gray-400">Assigned Roles</p>
                <p className="font-medium text-refuge-dark-blue dark:text-gray-200">{userInfo?.roles.length || 0}</p>
              </div>
              <div className="text-center p-4 bg-white dark:bg-gray-700 rounded-lg border dark:border-gray-600">
                <p className="text-sm text-gray-600 dark:text-gray-400">Permissions</p>
                <p className="font-medium text-refuge-dark-blue dark:text-gray-200">
                  {userInfo?.permissions.length || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Default Access Notice */}
        <Card className="border-refuge-purple/20 bg-refuge-purple/5 dark:bg-refuge-purple/10 dark:border-refuge-purple/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-refuge-purple dark:text-refuge-light-purple">
              <Home className="h-5 w-5" />
              Default Access Level
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <p className="text-refuge-dark-blue dark:text-gray-200">
                As a refugehouse.org domain user, you have default access to view foster homes information:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <span className="text-gray-700 dark:text-gray-300">View foster homes list and details</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <span className="text-gray-700 dark:text-gray-300">Access interactive geographic map</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <span className="text-gray-700 dark:text-gray-300">Filter and search home information</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <span className="text-gray-700 dark:text-gray-300">View case manager contact details</span>
                </div>
              </div>
              {userInfo?.roles && userInfo.roles.length > 0 && (
                <div className="mt-4 p-3 bg-white dark:bg-gray-700 rounded-lg border dark:border-gray-600">
                  <p className="text-sm font-medium text-refuge-dark-blue dark:text-gray-200 mb-2">
                    Additional Role-Based Access:
                  </p>
                  <div className="space-y-1">
                    {userInfo.roles.map((role, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        <Shield className="h-4 w-4 text-refuge-purple dark:text-refuge-light-purple" />
                        <span className="text-gray-700 dark:text-gray-300">
                          {role.role_name} in {role.app_name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="text-center dark:bg-gray-800 dark:border-gray-700">
            <CardContent className="py-6">
              <BarChart3 className="h-8 w-8 text-refuge-purple dark:text-refuge-light-purple mx-auto mb-2" />
              <p className="text-2xl font-bold text-refuge-dark-blue dark:text-gray-200">Active</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">System Status</p>
            </CardContent>
          </Card>
          <Card className="text-center dark:bg-gray-800 dark:border-gray-700">
            <CardContent className="py-6">
              <Home className="h-8 w-8 text-refuge-magenta dark:text-red-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-refuge-dark-blue dark:text-gray-200">Ready</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Data Access</p>
            </CardContent>
          </Card>
          <Card className="text-center dark:bg-gray-800 dark:border-gray-700">
            <CardContent className="py-6">
              <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-refuge-dark-blue dark:text-gray-200">Authorized</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">User Status</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
