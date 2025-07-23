"use client"

import { useEffect, useState } from "react"
import { useUser } from "@clerk/nextjs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  ArrowLeft,
  Database,
  Users,
  Shield,
  Settings,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  Activity,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

interface SystemStatus {
  database: string
  environment: string
  version: string
  uptime: string
  activeUsers: number
  totalRoles: number
  totalPermissions: number
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
  roles?: string[]
  permissions?: string[]
}

interface Role {
  role_name: string
  role_display_name: string
  role_level: number
  description: string
  user_count: number
  permissions: string
}

interface Permission {
  id: string
  permission_code: string
  permission_name: string
  description: string
  category: string
  created_at: string
}

export default function SystemAdminPage() {
  const { user } = useUser()
  const router = useRouter()

  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null)
  const [users, setUsers] = useState<AppUser[]>([])
  const [usersWithRoles, setUsersWithRoles] = useState<AppUser[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Check if user is system admin
  useEffect(() => {
    if (user && user.primaryEmailAddress?.emailAddress !== "jduarte@refugehouse.org") {
      router.push("/dashboard")
      return
    }
  }, [user, router])

  useEffect(() => {
    if (user?.primaryEmailAddress?.emailAddress === "jduarte@refugehouse.org") {
      fetchAllData()
    }
  }, [user])

  const fetchAllData = async () => {
    setLoading(true)
    setError(null)

    try {
      console.log("🔄 Fetching all admin data...")

      // Fetch system status
      const statusResponse = await fetch("/api/system-status")
      if (statusResponse.ok) {
        const statusData = await statusResponse.json()
        console.log("✅ System status:", statusData)
        setSystemStatus(statusData)
      } else {
        console.error("❌ Failed to fetch system status:", statusResponse.status)
      }

      // Fetch users
      const usersResponse = await fetch("/api/admin/users")
      if (usersResponse.ok) {
        const usersData = await usersResponse.json()
        console.log("✅ Users data:", usersData)
        setUsers(usersData.users || [])
        setUsersWithRoles(usersData.usersWithRoles || [])
      } else {
        console.error("❌ Failed to fetch users:", usersResponse.status)
        const errorData = await usersResponse.json()
        console.error("Error details:", errorData)
      }

      // Fetch roles
      const rolesResponse = await fetch("/api/admin/roles")
      if (rolesResponse.ok) {
        const rolesData = await rolesResponse.json()
        console.log("✅ Roles data:", rolesData)
        setRoles(rolesData || [])
      } else {
        console.error("❌ Failed to fetch roles:", rolesResponse.status)
      }

      // Fetch permissions
      const permissionsResponse = await fetch("/api/admin/permissions")
      if (permissionsResponse.ok) {
        const permissionsData = await permissionsResponse.json()
        console.log("✅ Permissions data:", permissionsData)
        setPermissions(permissionsData || [])
      } else {
        console.error("❌ Failed to fetch permissions:", permissionsResponse.status)
      }
    } catch (err) {
      console.error("❌ Error fetching admin data:", err)
      setError(err instanceof Error ? err.message : "Unknown error occurred")
    } finally {
      setLoading(false)
    }
  }

  if (!user || user.primaryEmailAddress?.emailAddress !== "jduarte@refugehouse.org") {
    return (
      <div className="container mx-auto p-6">
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardContent className="py-6">
            <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
              <AlertCircle className="h-5 w-5" />
              <span className="font-medium">Access Denied: System Administrator Only</span>
            </div>
          </CardContent>
        </Card>
      </div>
    )
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">System Administration</h1>
          <p className="text-gray-600 dark:text-gray-300">Home Visits Microservice Management</p>
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
              <CardDescription className="dark:text-gray-400">Current system health and statistics</CardDescription>
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
                  <Activity className="h-5 w-5 text-blue-500" />
                  <span className="font-medium text-gray-900 dark:text-gray-100">Environment</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">{systemStatus.environment}</p>
              </div>

              <div className="bg-white dark:bg-gray-700 p-4 rounded-lg border dark:border-gray-600">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-5 w-5 text-purple-500" />
                  <span className="font-medium text-gray-900 dark:text-gray-100">Uptime</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{systemStatus.uptime}</p>
              </div>

              <div className="bg-white dark:bg-gray-700 p-4 rounded-lg border dark:border-gray-600">
                <div className="flex items-center gap-2 mb-2">
                  <Settings className="h-5 w-5 text-orange-500" />
                  <span className="font-medium text-gray-900 dark:text-gray-100">Version</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{systemStatus.version}</p>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400">No system status data available</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Current Users Section */}
      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <Users className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <CardTitle className="text-xl text-gray-900 dark:text-gray-100">2. Current Users</CardTitle>
              <CardDescription className="dark:text-gray-400">
                All users registered in this microservice ({users.length} total)
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {users.length > 0 ? (
            <div className="space-y-4">
              {users.map((user) => (
                <div key={user.id} className="bg-white dark:bg-gray-700 p-4 rounded-lg border dark:border-gray-600">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-gray-100">
                        {user.first_name} {user.last_name}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{user.email}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-500">
                        Core Role: {user.core_role} | Created: {new Date(user.created_at).toLocaleDateString()}
                      </p>
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
              <p className="text-gray-500 dark:text-gray-400">No users found</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Permissions and Roles Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Roles */}
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <Shield className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <CardTitle className="text-xl text-gray-900 dark:text-gray-100">3a. Current Roles</CardTitle>
                <CardDescription className="dark:text-gray-400">
                  Role definitions ({roles.length} total)
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {roles.length > 0 ? (
              <div className="space-y-3">
                {roles.map((role, index) => (
                  <div key={index} className="bg-white dark:bg-gray-700 p-3 rounded-lg border dark:border-gray-600">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900 dark:text-gray-100">{role.role_name}</h4>
                      <Badge variant="outline">{role.user_count} users</Badge>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{role.description}</p>
                    {role.permissions && (
                      <p className="text-xs text-gray-500 dark:text-gray-500">
                        Permissions: {role.permissions || "None"}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500 dark:text-gray-400">No roles found</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Permissions */}
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                <Settings className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <CardTitle className="text-xl text-gray-900 dark:text-gray-100">3b. Current Permissions</CardTitle>
                <CardDescription className="dark:text-gray-400">
                  Permission definitions ({permissions.length} total)
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {permissions.length > 0 ? (
              <div className="space-y-3">
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
                    <p className="text-xs text-gray-500 dark:text-gray-500">Code: {permission.permission_code}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500 dark:text-gray-400">No permissions found</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Current User Objects Section */}
      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <Users className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <CardTitle className="text-xl text-gray-900 dark:text-gray-100">4. Current User Objects</CardTitle>
              <CardDescription className="dark:text-gray-400">
                Detailed user information with roles and permissions ({usersWithRoles.length} total)
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {usersWithRoles.length > 0 ? (
            <div className="space-y-4">
              {usersWithRoles.map((user) => (
                <div key={user.id} className="bg-white dark:bg-gray-700 p-4 rounded-lg border dark:border-gray-600">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* User Details */}
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">User Details</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        <strong>Name:</strong> {user.first_name} {user.last_name}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        <strong>Email:</strong> {user.email}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        <strong>Core Role:</strong> {user.core_role}
                      </p>
                      {user.department && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          <strong>Department:</strong> {user.department}
                        </p>
                      )}
                    </div>

                    {/* Activity */}
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Activity</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        <strong>Status:</strong>
                        <Badge variant={user.is_active ? "default" : "secondary"} className="ml-2">
                          {user.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        <strong>Created:</strong> {new Date(user.created_at).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        <strong>Updated:</strong> {new Date(user.updated_at).toLocaleDateString()}
                      </p>
                    </div>

                    {/* Access Control */}
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Access Control</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        <strong>Microservice Roles:</strong> {user.roles?.length || 0}
                      </p>
                      {user.roles && user.roles.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {user.roles.map((role, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {role}
                            </Badge>
                          ))}
                        </div>
                      )}
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                        <strong>Direct Permissions:</strong> {user.permissions?.length || 0}
                      </p>
                      {user.permissions && user.permissions.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {user.permissions.slice(0, 3).map((permission, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {permission}
                            </Badge>
                          ))}
                          {user.permissions.length > 3 && (
                            <Badge variant="secondary" className="text-xs">
                              +{user.permissions.length - 3} more
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400">No user objects found</p>
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
