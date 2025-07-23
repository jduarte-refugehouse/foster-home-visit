"use client"

import { useEffect, useState } from "react"
import { useUser } from "@clerk/nextjs"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  ArrowLeft,
  Database,
  Users,
  Shield,
  UserCheck,
  Activity,
  Clock,
  Server,
  AlertTriangle,
  CheckCircle,
} from "lucide-react"
import Link from "next/link"

interface SystemStatus {
  database: "connected" | "disconnected" | "error"
  environment: string
  version: string
  uptime: string
  lastCheck: string
}

interface AppUser {
  id: string
  clerk_user_id: string
  email: string
  first_name: string
  last_name: string
  core_role: string
  is_active: boolean
  created_at: string
  updated_at: string
  department?: string
  job_title?: string
}

interface AppRole {
  id: string
  role_name: string
  role_display_name: string
  role_level: number
  description: string
  permissions: string
}

interface AppPermission {
  id: string
  permission_code: string
  permission_name: string
  category: string
  description: string
  microservice_id: string
}

interface UserWithRoles extends AppUser {
  roles: string[]
  permissions: string[]
  microservice_roles: Array<{
    role_name: string
    role_display_name: string
    microservice_name: string
  }>
}

export default function SystemAdminPage() {
  const { user, isLoaded } = useUser()
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null)
  const [appUsers, setAppUsers] = useState<AppUser[]>([])
  const [usersWithRoles, setUsersWithRoles] = useState<UserWithRoles[]>([])
  const [appRoles, setAppRoles] = useState<AppRole[]>([])
  const [appPermissions, setAppPermissions] = useState<AppPermission[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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
      setError(null)

      // Fetch system status
      try {
        const statusResponse = await fetch("/api/system-status")
        if (statusResponse.ok) {
          const statusData = await statusResponse.json()
          setSystemStatus(statusData)
        } else {
          setSystemStatus({
            database: "error",
            environment: "Unknown",
            version: "1.0.0",
            uptime: "Unknown",
            lastCheck: new Date().toISOString(),
          })
        }
      } catch (err) {
        console.error("Error fetching system status:", err)
        setSystemStatus({
          database: "error",
          environment: "Development",
          version: "1.0.0",
          uptime: "Unknown",
          lastCheck: new Date().toISOString(),
        })
      }

      // Fetch app users
      try {
        const usersResponse = await fetch("/api/admin/users")
        if (usersResponse.ok) {
          const usersData = await usersResponse.json()
          setAppUsers(usersData.users || [])
          setUsersWithRoles(usersData.usersWithRoles || [])
        }
      } catch (err) {
        console.error("Error fetching users:", err)
      }

      // Fetch app roles
      try {
        const rolesResponse = await fetch("/api/admin/roles")
        if (rolesResponse.ok) {
          const rolesData = await rolesResponse.json()
          setAppRoles(rolesData || [])
        }
      } catch (err) {
        console.error("Error fetching roles:", err)
      }

      // Fetch app permissions
      try {
        const permissionsResponse = await fetch("/api/admin/permissions")
        if (permissionsResponse.ok) {
          const permissionsData = await permissionsResponse.json()
          setAppPermissions(permissionsData || [])
        }
      } catch (err) {
        console.error("Error fetching permissions:", err)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch system data")
    } finally {
      setLoading(false)
    }
  }

  if (!isLoaded || !isSystemAdmin) {
    return null
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "connected":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "disconnected":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case "error":
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      default:
        return <Activity className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "connected":
        return "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800"
      case "disconnected":
        return "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800"
      case "error":
        return "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800"
      default:
        return "bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-800"
    }
  }

  return (
    <div className="container mx-auto p-8 space-y-8 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
            <Server className="h-8 w-8 text-orange-500" />
            System Administration
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2 text-lg">
            Home Visits Microservice - Administrative Tools & System Overview
          </p>
        </div>
        <Link href="/dashboard">
          <Button variant="outline" className="flex items-center gap-2 bg-transparent px-6 py-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
      </div>

      <Separator className="dark:border-gray-700" />

      {error && (
        <Card className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
          <CardContent className="py-6">
            <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
              <AlertTriangle className="h-5 w-5" />
              <span className="font-medium">Error: {error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400 text-lg">Loading system data...</p>
        </div>
      ) : (
        <div className="grid gap-8">
          {/* 1. System Status */}
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-orange-600 dark:text-orange-400 text-xl">
                <Activity className="h-6 w-6" />
                1. System Status
              </CardTitle>
              <CardDescription className="dark:text-gray-400 text-base">
                Current system health and operational status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="text-center p-6 bg-white dark:bg-gray-700 rounded-lg border dark:border-gray-600">
                  <div className="flex items-center justify-center mb-3">
                    {getStatusIcon(systemStatus?.database || "unknown")}
                    <Database className="h-6 w-6 ml-2 text-blue-600 dark:text-blue-400" />
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Database Connection</p>
                  <Badge variant="outline" className={getStatusColor(systemStatus?.database || "unknown")}>
                    {systemStatus?.database || "Unknown"}
                  </Badge>
                </div>
                <div className="text-center p-6 bg-white dark:bg-gray-700 rounded-lg border dark:border-gray-600">
                  <Server className="h-6 w-6 mx-auto mb-3 text-green-600 dark:text-green-400" />
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Environment</p>
                  <p className="font-medium text-gray-900 dark:text-gray-200">
                    {systemStatus?.environment || "Development"}
                  </p>
                </div>
                <div className="text-center p-6 bg-white dark:bg-gray-700 rounded-lg border dark:border-gray-600">
                  <Shield className="h-6 w-6 mx-auto mb-3 text-purple-600 dark:text-purple-400" />
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Application Version</p>
                  <p className="font-medium text-gray-900 dark:text-gray-200">{systemStatus?.version || "1.0.0"}</p>
                </div>
                <div className="text-center p-6 bg-white dark:bg-gray-700 rounded-lg border dark:border-gray-600">
                  <Clock className="h-6 w-6 mx-auto mb-3 text-orange-600 dark:text-orange-400" />
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">System Uptime</p>
                  <p className="font-medium text-gray-900 dark:text-gray-200">{systemStatus?.uptime || "Active"}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 2. Current Users */}
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-orange-600 dark:text-orange-400 text-xl">
                <Users className="h-6 w-6" />
                2. Current Users for this Microservice
              </CardTitle>
              <CardDescription className="dark:text-gray-400 text-base">
                All users registered in the Home Visits application ({appUsers.length} total users)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {appUsers.length > 0 ? (
                  appUsers.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-4 bg-white dark:bg-gray-700 rounded-lg border dark:border-gray-600 hover:shadow-md transition-shadow"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <p className="font-semibold text-gray-900 dark:text-gray-200 text-lg">
                            {user.first_name} {user.last_name}
                          </p>
                          <Badge variant={user.is_active ? "default" : "secondary"} className="text-xs">
                            {user.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{user.email}</p>
                        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-500">
                          <span>User ID: {user.id.substring(0, 8)}...</span>
                          <span>•</span>
                          <span>Created: {new Date(user.created_at).toLocaleDateString()}</span>
                          {user.department && (
                            <>
                              <span>•</span>
                              <span>Dept: {user.department}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs font-medium">
                          {user.core_role.replace("_", " ").toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-500 dark:text-gray-400 text-lg">No users found</p>
                    <p className="text-gray-400 dark:text-gray-500 text-sm">Users will appear here once they sign up</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 3. Current Permissions/Roles */}
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-orange-600 dark:text-orange-400 text-xl">
                <Shield className="h-6 w-6" />
                3. Current Permissions/Roles for this App
              </CardTitle>
              <CardDescription className="dark:text-gray-400 text-base">
                Role definitions and associated permissions ({appRoles.length} roles, {appPermissions.length}{" "}
                permissions)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Roles Section */}
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-gray-200 mb-4 text-lg flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Defined Roles ({appRoles.length})
                  </h4>
                  <div className="space-y-3 max-h-80 overflow-y-auto">
                    {appRoles.length > 0 ? (
                      appRoles.map((role, index) => (
                        <div
                          key={index}
                          className="p-4 bg-white dark:bg-gray-700 rounded-lg border dark:border-gray-600"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <p className="font-medium text-gray-900 dark:text-gray-200">{role.role_display_name}</p>
                            <Badge variant="outline" className="text-xs">
                              Level {role.role_level}
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mb-2 font-mono">{role.role_name}</p>
                          {role.description && (
                            <p className="text-sm text-gray-500 dark:text-gray-500 mb-2">{role.description}</p>
                          )}
                          {role.permissions && (
                            <div className="mt-2">
                              <p className="text-xs text-gray-500 dark:text-gray-500 mb-1">Permissions:</p>
                              <div className="flex flex-wrap gap-1">
                                {role.permissions
                                  .split(", ")
                                  .filter((p) => p)
                                  .map((permission, idx) => (
                                    <Badge key={idx} variant="secondary" className="text-xs">
                                      {permission}
                                    </Badge>
                                  ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <Shield className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                        <p className="text-gray-500 dark:text-gray-400">No roles defined</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Permissions Section */}
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-gray-200 mb-4 text-lg flex items-center gap-2">
                    <UserCheck className="h-5 w-5" />
                    Defined Permissions ({appPermissions.length})
                  </h4>
                  <div className="space-y-3 max-h-80 overflow-y-auto">
                    {appPermissions.length > 0 ? (
                      appPermissions.map((permission, index) => (
                        <div
                          key={index}
                          className="p-4 bg-white dark:bg-gray-700 rounded-lg border dark:border-gray-600"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <p className="font-medium text-gray-900 dark:text-gray-200 text-sm">
                              {permission.permission_name}
                            </p>
                            <Badge variant="outline" className="text-xs">
                              {permission.category}
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1 font-mono">
                            {permission.permission_code}
                          </p>
                          {permission.description && (
                            <p className="text-xs text-gray-500 dark:text-gray-500">{permission.description}</p>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <UserCheck className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                        <p className="text-gray-500 dark:text-gray-400">No permissions defined</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 4. Current User Objects */}
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-orange-600 dark:text-orange-400 text-xl">
                <Database className="h-6 w-6" />
                4. Current User Objects in this Microservice
              </CardTitle>
              <CardDescription className="dark:text-gray-400 text-base">
                Detailed user information with role assignments and permission grants for this application
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {usersWithRoles.length > 0 ? (
                  usersWithRoles.map((user) => (
                    <div key={user.id} className="p-6 bg-white dark:bg-gray-700 rounded-lg border dark:border-gray-600">
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* User Details */}
                        <div>
                          <h5 className="font-semibold text-gray-900 dark:text-gray-200 mb-3 flex items-center gap-2">
                            <UserCheck className="h-4 w-4" />
                            User Details
                          </h5>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600 dark:text-gray-400">Name:</span>
                              <span className="text-gray-900 dark:text-gray-200 font-medium">
                                {user.first_name} {user.last_name}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600 dark:text-gray-400">Email:</span>
                              <span className="text-gray-900 dark:text-gray-200">{user.email}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600 dark:text-gray-400">ID:</span>
                              <span className="text-gray-900 dark:text-gray-200 font-mono text-xs">
                                {user.id.substring(0, 12)}...
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600 dark:text-gray-400">Core Role:</span>
                              <Badge variant="outline" className="text-xs">
                                {user.core_role.replace("_", " ").toUpperCase()}
                              </Badge>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600 dark:text-gray-400">Status:</span>
                              <Badge variant={user.is_active ? "default" : "secondary"} className="text-xs">
                                {user.is_active ? "Active" : "Inactive"}
                              </Badge>
                            </div>
                          </div>
                        </div>

                        {/* Activity Information */}
                        <div>
                          <h5 className="font-semibold text-gray-900 dark:text-gray-200 mb-3 flex items-center gap-2">
                            <Activity className="h-4 w-4" />
                            Activity
                          </h5>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600 dark:text-gray-400">Created:</span>
                              <span className="text-gray-900 dark:text-gray-200">
                                {new Date(user.created_at).toLocaleDateString()}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600 dark:text-gray-400">Updated:</span>
                              <span className="text-gray-900 dark:text-gray-200">
                                {new Date(user.updated_at).toLocaleDateString()}
                              </span>
                            </div>
                            {user.department && (
                              <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-400">Department:</span>
                                <span className="text-gray-900 dark:text-gray-200">{user.department}</span>
                              </div>
                            )}
                            {user.job_title && (
                              <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-400">Job Title:</span>
                                <span className="text-gray-900 dark:text-gray-200">{user.job_title}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Roles and Permissions */}
                        <div>
                          <h5 className="font-semibold text-gray-900 dark:text-gray-200 mb-3 flex items-center gap-2">
                            <Shield className="h-4 w-4" />
                            Access Control
                          </h5>
                          <div className="space-y-3">
                            {/* Microservice Roles */}
                            <div>
                              <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">Microservice Roles:</p>
                              <div className="flex flex-wrap gap-1">
                                {user.microservice_roles && user.microservice_roles.length > 0 ? (
                                  user.microservice_roles.map((role, idx) => (
                                    <Badge key={idx} variant="outline" className="text-xs">
                                      {role.role_display_name}
                                    </Badge>
                                  ))
                                ) : (
                                  <span className="text-xs text-gray-500 dark:text-gray-500">No roles assigned</span>
                                )}
                              </div>
                            </div>

                            {/* Direct Permissions */}
                            <div>
                              <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">Direct Permissions:</p>
                              <div className="flex flex-wrap gap-1">
                                {user.permissions && user.permissions.length > 0 ? (
                                  user.permissions.slice(0, 3).map((permission, idx) => (
                                    <Badge key={idx} variant="secondary" className="text-xs">
                                      {permission}
                                    </Badge>
                                  ))
                                ) : (
                                  <span className="text-xs text-gray-500 dark:text-gray-500">
                                    No direct permissions
                                  </span>
                                )}
                                {user.permissions && user.permissions.length > 3 && (
                                  <Badge variant="secondary" className="text-xs">
                                    +{user.permissions.length - 3} more
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <Database className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-500 dark:text-gray-400 text-lg">No user objects found</p>
                    <p className="text-gray-400 dark:text-gray-500 text-sm">
                      User role assignments will appear here once configured
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
