"use client"

import { useEffect, useState } from "react"
import { useUser } from "@clerk/nextjs"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Database, Users, Shield, UserCheck, Activity, Clock, Server } from "lucide-react"
import Link from "next/link"

interface SystemStatus {
  database: string
  environment: string
  version: string
  uptime: string
}

interface UserData {
  id: string
  email: string
  firstName: string
  lastName: string
  createdAt: string
  lastSignIn: string
  roles: string[]
}

interface RoleData {
  id: string
  name: string
  permissions: string[]
  userCount: number
}

export default function SystemAdminPage() {
  const { user, isLoaded } = useUser()
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null)
  const [users, setUsers] = useState<UserData[]>([])
  const [roles, setRoles] = useState<RoleData[]>([])
  const [loading, setLoading] = useState(true)

  // Check if user is system admin
  const isSystemAdmin = user?.primaryEmailAddress?.emailAddress === "jduarte@refugehouse.org"

  useEffect(() => {
    if (isLoaded && !isSystemAdmin) {
      redirect("/dashboard")
    }
  }, [isLoaded, isSystemAdmin])

  useEffect(() => {
    if (isSystemAdmin) {
      fetchSystemData()
    }
  }, [isSystemAdmin])

  const fetchSystemData = async () => {
    try {
      // Fetch system status
      const statusResponse = await fetch("/api/system-status")
      const statusData = await statusResponse.json()
      setSystemStatus(statusData)

      // Fetch users
      const usersResponse = await fetch("/api/admin/users")
      const usersData = await usersResponse.json()
      setUsers(usersData.users || [])

      // Fetch roles
      const rolesResponse = await fetch("/api/admin/roles")
      const rolesData = await rolesResponse.json()
      setRoles(rolesData.roles || [])

      setLoading(false)
    } catch (error) {
      console.error("Error fetching system data:", error)
      setLoading(false)
    }
  }

  if (!isLoaded || !isSystemAdmin) {
    return null
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">System Administration</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Comprehensive system overview and management tools</p>
        </div>
        <Link href="/dashboard">
          <Button variant="outline" className="flex items-center gap-2 bg-transparent">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
      </div>

      <Separator />

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Loading system data...</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {/* System Status */}
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
                <Activity className="h-5 w-5" />
                System Status
              </CardTitle>
              <CardDescription className="dark:text-gray-400">Current system health and configuration</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Database className="h-4 w-4 text-green-500" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Database</span>
                  </div>
                  <Badge
                    variant="outline"
                    className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800"
                  >
                    {systemStatus?.database || "Connected"}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Server className="h-4 w-4 text-blue-500" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Environment</span>
                  </div>
                  <Badge
                    variant="outline"
                    className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800"
                  >
                    {systemStatus?.environment || "Production"}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-purple-500" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Version</span>
                  </div>
                  <Badge
                    variant="outline"
                    className="bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800"
                  >
                    {systemStatus?.version || "1.0.0"}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-orange-500" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Uptime</span>
                  </div>
                  <Badge
                    variant="outline"
                    className="bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800"
                  >
                    {systemStatus?.uptime || "24h 15m"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Current Users */}
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
                <Users className="h-5 w-5" />
                Current Users ({users.length})
              </CardTitle>
              <CardDescription className="dark:text-gray-400">
                All users registered in this microservice application
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {users.length > 0 ? (
                  users.map((userData) => (
                    <div
                      key={userData.id}
                      className="flex items-center justify-between p-3 border rounded-lg dark:border-gray-600 dark:bg-gray-700/50"
                    >
                      <div className="space-y-1">
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          {userData.firstName} {userData.lastName}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{userData.email}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {userData.roles.map((role) => (
                          <Badge key={role} variant="secondary" className="dark:bg-gray-600 dark:text-gray-200">
                            {role}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-600 dark:text-gray-400 text-center py-4">No users found</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Current Permissions/Roles */}
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
                <Shield className="h-5 w-5" />
                Current Permissions/Roles ({roles.length})
              </CardTitle>
              <CardDescription className="dark:text-gray-400">
                Role definitions and permissions for this application
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {roles.length > 0 ? (
                  roles.map((role) => (
                    <div key={role.id} className="p-4 border rounded-lg dark:border-gray-600 dark:bg-gray-700/50">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-gray-900 dark:text-gray-100">{role.name}</h4>
                        <Badge variant="outline" className="dark:border-gray-500 dark:text-gray-300">
                          {role.userCount} users
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {role.permissions.map((permission) => (
                          <Badge
                            key={permission}
                            variant="secondary"
                            className="text-xs dark:bg-gray-600 dark:text-gray-200"
                          >
                            {permission}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-600 dark:text-gray-400 text-center py-4">No roles found</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Current User Objects */}
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
                <UserCheck className="h-5 w-5" />
                Current User Objects
              </CardTitle>
              <CardDescription className="dark:text-gray-400">
                Detailed user information and role assignments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {users.length > 0 ? (
                  users.map((userData) => (
                    <div key={userData.id} className="p-4 border rounded-lg dark:border-gray-600 dark:bg-gray-700/50">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <h5 className="font-medium text-gray-900 dark:text-gray-100 mb-2">User Details</h5>
                          <div className="space-y-1 text-sm">
                            <p className="text-gray-600 dark:text-gray-400">ID: {userData.id}</p>
                            <p className="text-gray-600 dark:text-gray-400">Email: {userData.email}</p>
                            <p className="text-gray-600 dark:text-gray-400">
                              Name: {userData.firstName} {userData.lastName}
                            </p>
                          </div>
                        </div>
                        <div>
                          <h5 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Activity</h5>
                          <div className="space-y-1 text-sm">
                            <p className="text-gray-600 dark:text-gray-400">Created: {userData.createdAt}</p>
                            <p className="text-gray-600 dark:text-gray-400">Last Sign In: {userData.lastSignIn}</p>
                          </div>
                        </div>
                        <div>
                          <h5 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Roles</h5>
                          <div className="flex flex-wrap gap-1">
                            {userData.roles.map((role) => (
                              <Badge
                                key={role}
                                variant="outline"
                                className="text-xs dark:border-gray-500 dark:text-gray-300"
                              >
                                {role}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-600 dark:text-gray-400 text-center py-4">No user objects found</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
