"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Database, Users, Shield, Settings, CheckCircle, XCircle, AlertCircle } from "lucide-react"
import Link from "next/link"

interface SystemStatus {
  database: string
  environment: string
  version: string
  uptime: string
  totalUsers: number
  activeUsers: number
  totalRoles: number
  totalPermissions: number
  totalApps: number
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

interface UserRole {
  id: string
  user_id: string
  microservice_id: string
  role_name: string
  granted_by: string
  granted_at: string
  is_active: boolean
}

interface Permission {
  id: string
  microservice_id: string
  permission_code: string
  permission_name: string
  description: string
  category: string
  created_at: string
}

interface MicroserviceApp {
  id: string
  app_code: string
  app_name: string
  app_url: string
  description: string
  is_active: boolean
  created_at: string
}

export default function SystemAdminPage() {
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null)
  const [users, setUsers] = useState<AppUser[]>([])
  const [userRoles, setUserRoles] = useState<UserRole[]>([])
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [microserviceApps, setMicroserviceApps] = useState<MicroserviceApp[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchAllData()
  }, [])

  const fetchAllData = async () => {
    setLoading(true)
    setError(null)

    try {
      console.log("🔄 Fetching all admin data (no auth, no filters)...")

      // Fetch system status
      const statusResponse = await fetch("/api/system-status")
      if (statusResponse.ok) {
        const statusData = await statusResponse.json()
        console.log("✅ System status:", statusData)
        setSystemStatus(statusData)
      } else {
        console.error("❌ Failed to fetch system status:", statusResponse.status)
        const errorText = await statusResponse.text()
        console.error("Status error details:", errorText)
      }

      // Fetch users
      const usersResponse = await fetch("/api/admin/users")
      if (usersResponse.ok) {
        const usersData = await usersResponse.json()
        console.log("✅ Users data:", usersData)
        setUsers(usersData.users || [])
        setUserRoles(usersData.userRoles || [])
        setPermissions(usersData.permissions || [])
        setMicroserviceApps(usersData.microserviceApps || [])
      } else {
        console.error("❌ Failed to fetch users:", usersResponse.status)
        const errorData = await usersResponse.text()
        console.error("Users error details:", errorData)
      }

      // Fetch roles
      const rolesResponse = await fetch("/api/admin/roles")
      if (rolesResponse.ok) {
        const rolesData = await rolesResponse.json()
        console.log("✅ Roles data:", rolesData)
        // Update userRoles if we got more data
        if (rolesData.allRoles && rolesData.allRoles.length > 0) {
          setUserRoles(rolesData.allRoles)
        }
      } else {
        console.error("❌ Failed to fetch roles:", rolesResponse.status)
        const errorText = await rolesResponse.text()
        console.error("Roles error details:", errorText)
      }

      // Fetch permissions
      const permissionsResponse = await fetch("/api/admin/permissions")
      if (permissionsResponse.ok) {
        const permissionsData = await permissionsResponse.json()
        console.log("✅ Permissions data:", permissionsData)
        if (permissionsData.permissions && permissionsData.permissions.length > 0) {
          setPermissions(permissionsData.permissions)
        }
        if (permissionsData.microserviceApps && permissionsData.microserviceApps.length > 0) {
          setMicroserviceApps(permissionsData.microserviceApps)
        }
      } else {
        console.error("❌ Failed to fetch permissions:", permissionsResponse.status)
        const errorText = await permissionsResponse.text()
        console.error("Permissions error details:", errorText)
      }
    } catch (err) {
      console.error("❌ Error fetching admin data:", err)
      setError(err instanceof Error ? err.message : "Unknown error occurred")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400 text-lg">Loading all system data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">System Administration</h1>
          <p className="text-gray-600 dark:text-gray-300">All Database Tables - No Auth, No Filters Applied</p>
        </div>
        <Link href="/dashboard">
          <Button variant="outline" className="dark:border-gray-600 dark:text-gray-300 bg-transparent">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
      </div>

      <Separator className="dark:border-gray-700" />

      {error && (
        <Card className="border-red-200 dark:border-red-800">
          <CardContent className="py-4">
            <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
              <AlertCircle className="h-5 w-5" />
              <span>Error: {error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* System Status Section */}
      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Database className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <CardTitle className="text-xl text-gray-900 dark:text-gray-100">1. System Status</CardTitle>
              <CardDescription className="dark:text-gray-400">Database connection and table counts</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {systemStatus ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-gray-700 p-4 rounded-lg border dark:border-gray-600">
                <div className="flex items-center gap-2 mb-2">
                  {systemStatus.database === "connected" ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500" />
                  )}
                  <span className="font-medium text-gray-900 dark:text-gray-100">Database</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">{systemStatus.database}</p>
              </div>

              <div className="bg-white dark:bg-gray-700 p-4 rounded-lg border dark:border-gray-600">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="h-5 w-5 text-green-500" />
                  <span className="font-medium text-gray-900 dark:text-gray-100">Total Users</span>
                </div>
                <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{systemStatus.totalUsers}</p>
                <p className="text-xs text-gray-500 dark:text-gray-500">({systemStatus.activeUsers} active)</p>
              </div>

              <div className="bg-white dark:bg-gray-700 p-4 rounded-lg border dark:border-gray-600">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="h-5 w-5 text-purple-500" />
                  <span className="font-medium text-gray-900 dark:text-gray-100">Total Roles</span>
                </div>
                <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{systemStatus.totalRoles}</p>
              </div>

              <div className="bg-white dark:bg-gray-700 p-4 rounded-lg border dark:border-gray-600">
                <div className="flex items-center gap-2 mb-2">
                  <Settings className="h-5 w-5 text-orange-500" />
                  <span className="font-medium text-gray-900 dark:text-gray-100">Total Permissions</span>
                </div>
                <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{systemStatus.totalPermissions}</p>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400">No system status data available</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* All Users Section */}
      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <Users className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <CardTitle className="text-xl text-gray-900 dark:text-gray-100">2. All Users (app_users table)</CardTitle>
              <CardDescription className="dark:text-gray-400">
                Complete list from app_users table ({users.length} total)
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {users.length > 0 ? (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {users.map((user) => (
                <div key={user.id} className="bg-white dark:bg-gray-700 p-4 rounded-lg border dark:border-gray-600">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-gray-100">
                        {user.first_name} {user.last_name}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{user.email}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-500">
                        ID: {user.id} | Core Role: {user.core_role} | Created:{" "}
                        {new Date(user.created_at).toLocaleDateString()}
                      </p>
                      {user.department && (
                        <p className="text-xs text-gray-500 dark:text-gray-500">Department: {user.department}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={user.is_active ? "default" : "secondary"}>
                        {user.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400">No users found in app_users table</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* All User Roles Section */}
      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Shield className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <CardTitle className="text-xl text-gray-900 dark:text-gray-100">
                3. All User Roles (user_roles table)
              </CardTitle>
              <CardDescription className="dark:text-gray-400">
                Complete list from user_roles table ({userRoles.length} total)
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {userRoles.length > 0 ? (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {userRoles.map((role) => (
                <div key={role.id} className="bg-white dark:bg-gray-700 p-3 rounded-lg border dark:border-gray-600">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900 dark:text-gray-100">{role.role_name}</h4>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">User: {role.user_id.substring(0, 8)}...</Badge>
                      <Badge variant={role.is_active ? "default" : "secondary"}>
                        {role.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-500">
                    Microservice: {role.microservice_id.substring(0, 8)}... | Granted by: {role.granted_by} | Granted:{" "}
                    {new Date(role.granted_at).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400">No user roles found in user_roles table</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* All Permissions Section */}
      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
              <Settings className="h-6 w-6 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <CardTitle className="text-xl text-gray-900 dark:text-gray-100">
                4. All Permissions (permissions table)
              </CardTitle>
              <CardDescription className="dark:text-gray-400">
                Complete list from permissions table ({permissions.length} total)
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {permissions.length > 0 ? (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {permissions.map((permission) => (
                <div
                  key={permission.id}
                  className="bg-white dark:bg-gray-700 p-3 rounded-lg border dark:border-gray-600"
                >
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-medium text-gray-900 dark:text-gray-100">{permission.permission_name}</h4>
                    <Badge variant="outline">{permission.category}</Badge>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{permission.description}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-500">
                    Code: {permission.permission_code} | Microservice: {permission.microservice_id.substring(0, 8)}... |
                    Created: {new Date(permission.created_at).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400">No permissions found in permissions table</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* All Microservice Apps Section */}
      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <Database className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <CardTitle className="text-xl text-gray-900 dark:text-gray-100">
                5. All Microservice Apps (microservice_apps table)
              </CardTitle>
              <CardDescription className="dark:text-gray-400">
                Complete list from microservice_apps table ({microserviceApps.length} total)
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {microserviceApps.length > 0 ? (
            <div className="space-y-4">
              {microserviceApps.map((app) => (
                <div key={app.id} className="bg-white dark:bg-gray-700 p-4 rounded-lg border dark:border-gray-600">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-gray-100">{app.app_name}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{app.description}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-500">
                        Code: {app.app_code} | URL: {app.app_url} | ID: {app.id}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500">
                        Created: {new Date(app.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={app.is_active ? "default" : "secondary"}>
                        {app.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400">No microservice apps found</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Refresh Button */}
      <div className="flex justify-center">
        <Button onClick={fetchAllData} disabled={loading}>
          {loading ? "Refreshing..." : "Refresh All Data"}
        </Button>
      </div>
    </div>
  )
}
