"use client"

import { useUser } from "@clerk/nextjs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Database, Users, Shield, Activity, Server, CheckCircle, AlertTriangle } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { redirect } from "next/navigation"

interface SystemStatus {
  database: "connected" | "disconnected" | "error"
  uptime: string
  version: string
  environment: string
}

interface AppUser {
  id: string
  email: string
  first_name: string
  last_name: string
  core_role: string
  is_active: boolean
  created_at: string
}

interface AppRole {
  role_name: string
  role_display_name: string
  role_level: number
  description: string
  permissions: string
}

interface AppPermission {
  permission_code: string
  permission_name: string
  category: string
  description: string
}

export default function SystemAdminPage() {
  const { user } = useUser()
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null)
  const [appUsers, setAppUsers] = useState<AppUser[]>([])
  const [appRoles, setAppRoles] = useState<AppRole[]>([])
  const [appPermissions, setAppPermissions] = useState<AppPermission[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Security check - only allow jduarte@refugehouse.org
  useEffect(() => {
    if (user && user.primaryEmailAddress?.emailAddress !== "jduarte@refugehouse.org") {
      redirect("/dashboard")
    }
  }, [user])

  useEffect(() => {
    if (user?.primaryEmailAddress?.emailAddress === "jduarte@refugehouse.org") {
      fetchSystemData()
    }
  }, [user])

  const fetchSystemData = async () => {
    try {
      // Fetch system status
      const statusResponse = await fetch("/api/system-status")
      if (statusResponse.ok) {
        const statusData = await statusResponse.json()
        setSystemStatus(statusData)
      }

      // Fetch app users
      const usersResponse = await fetch("/api/admin/users")
      if (usersResponse.ok) {
        const usersData = await usersResponse.json()
        setAppUsers(usersData.users || [])
      }

      // Fetch app roles
      const rolesResponse = await fetch("/api/admin/roles")
      if (rolesResponse.ok) {
        const rolesData = await rolesResponse.json()
        setAppRoles(rolesData || [])
      }

      // Fetch app permissions
      const permissionsResponse = await fetch("/api/admin/permissions")
      if (permissionsResponse.ok) {
        const permissionsData = await permissionsResponse.json()
        setAppPermissions(permissionsData || [])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch system data")
    } finally {
      setLoading(false)
    }
  }

  if (!user || user.primaryEmailAddress?.emailAddress !== "jduarte@refugehouse.org") {
    return null // Will redirect via useEffect
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-refuge-gray dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-refuge-gray dark:bg-gray-900 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-3xl text-orange-600 dark:text-orange-400 flex items-center gap-3">
                  <Server className="h-8 w-8" />
                  System Administration
                </CardTitle>
                <CardDescription className="text-lg mt-2 text-gray-600 dark:text-gray-300">
                  Home Visits Microservice - Administrative Tools
                </CardDescription>
              </div>
              <Link href="/dashboard">
                <Button
                  variant="outline"
                  className="border-refuge-purple text-refuge-purple hover:bg-refuge-purple hover:text-white dark:border-refuge-light-purple dark:text-refuge-light-purple dark:hover:bg-refuge-light-purple dark:hover:text-gray-900 bg-transparent"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
            </div>
          </CardHeader>
        </Card>

        {error && (
          <Card className="border-red-200 dark:border-red-800">
            <CardContent className="py-6">
              <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
                <AlertTriangle className="h-5 w-5" />
                <span className="font-medium">Error: {error}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 1. System Status */}
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
              <Activity className="h-5 w-5" />
              1. System Status
            </CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-300">
              Current system health and operational status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-white dark:bg-gray-700 rounded-lg border dark:border-gray-600">
                <Database className="h-6 w-6 mx-auto mb-2 text-blue-600 dark:text-blue-400" />
                <p className="text-sm text-gray-600 dark:text-gray-400">Database</p>
                <Badge variant={systemStatus?.database === "connected" ? "default" : "destructive"} className="mt-1">
                  {systemStatus?.database || "Unknown"}
                </Badge>
              </div>
              <div className="text-center p-4 bg-white dark:bg-gray-700 rounded-lg border dark:border-gray-600">
                <CheckCircle className="h-6 w-6 mx-auto mb-2 text-green-600 dark:text-green-400" />
                <p className="text-sm text-gray-600 dark:text-gray-400">Environment</p>
                <p className="font-medium text-gray-900 dark:text-gray-200">
                  {systemStatus?.environment || "Development"}
                </p>
              </div>
              <div className="text-center p-4 bg-white dark:bg-gray-700 rounded-lg border dark:border-gray-600">
                <Server className="h-6 w-6 mx-auto mb-2 text-purple-600 dark:text-purple-400" />
                <p className="text-sm text-gray-600 dark:text-gray-400">Version</p>
                <p className="font-medium text-gray-900 dark:text-gray-200">{systemStatus?.version || "1.0.0"}</p>
              </div>
              <div className="text-center p-4 bg-white dark:bg-gray-700 rounded-lg border dark:border-gray-600">
                <Activity className="h-6 w-6 mx-auto mb-2 text-orange-600 dark:text-orange-400" />
                <p className="text-sm text-gray-600 dark:text-gray-400">Uptime</p>
                <p className="font-medium text-gray-900 dark:text-gray-200">{systemStatus?.uptime || "Active"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 2. Current Users */}
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
              <Users className="h-5 w-5" />
              2. Current Users for this Microservice
            </CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-300">
              All users registered in the Home Visits application ({appUsers.length} total)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {appUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-3 bg-white dark:bg-gray-700 rounded-lg border dark:border-gray-600"
                >
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 dark:text-gray-200">
                      {user.first_name} {user.last_name}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{user.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {user.core_role}
                    </Badge>
                    <Badge variant={user.is_active ? "default" : "secondary"} className="text-xs">
                      {user.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>
              ))}
              {appUsers.length === 0 && (
                <p className="text-center text-gray-500 dark:text-gray-400 py-8">No users found</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 3. Current Permissions/Roles */}
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
              <Shield className="h-5 w-5" />
              3. Current Permissions/Roles for this App
            </CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-300">
              Role definitions and associated permissions ({appRoles.length} roles, {appPermissions.length} permissions)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Roles */}
              <div>
                <h4 className="font-medium text-gray-900 dark:text-gray-200 mb-3">Defined Roles</h4>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {appRoles.map((role, index) => (
                    <div key={index} className="p-3 bg-white dark:bg-gray-700 rounded-lg border dark:border-gray-600">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-medium text-sm text-gray-900 dark:text-gray-200">{role.role_display_name}</p>
                        <Badge variant="outline" className="text-xs">
                          Level {role.role_level}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400">{role.role_name}</p>
                      {role.description && (
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">{role.description}</p>
                      )}
                    </div>
                  ))}
                  {appRoles.length === 0 && (
                    <p className="text-center text-gray-500 dark:text-gray-400 py-4">No roles defined</p>
                  )}
                </div>
              </div>

              {/* Permissions */}
              <div>
                <h4 className="font-medium text-gray-900 dark:text-gray-200 mb-3">Defined Permissions</h4>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {appPermissions.map((permission, index) => (
                    <div key={index} className="p-3 bg-white dark:bg-gray-700 rounded-lg border dark:border-gray-600">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-medium text-sm text-gray-900 dark:text-gray-200">
                          {permission.permission_name}
                        </p>
                        <Badge variant="outline" className="text-xs">
                          {permission.category}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400">{permission.permission_code}</p>
                      {permission.description && (
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">{permission.description}</p>
                      )}
                    </div>
                  ))}
                  {appPermissions.length === 0 && (
                    <p className="text-center text-gray-500 dark:text-gray-400 py-4">No permissions defined</p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 4. Current User Objects */}
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
              <Database className="h-5 w-5" />
              4. Current User Objects in this Microservice
            </CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-300">
              User role assignments and permission grants for this application
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {appUsers.map((user) => (
                <div key={user.id} className="p-4 bg-white dark:bg-gray-700 rounded-lg border dark:border-gray-600">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-200">
                        {user.first_name} {user.last_name}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{user.email}</p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      Core: {user.core_role}
                    </Badge>
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-500">
                    <p>User ID: {user.id}</p>
                    <p>Created: {new Date(user.created_at).toLocaleDateString()}</p>
                    <p>Status: {user.is_active ? "Active" : "Inactive"}</p>
                  </div>
                </div>
              ))}
              {appUsers.length === 0 && (
                <p className="text-center text-gray-500 dark:text-gray-400 py-8">No user objects found</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
