"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { CheckCircle, XCircle, Users, Shield, Key, Database, Clock, Server } from "lucide-react"

interface SystemStatus {
  database: string
  environment: string
  version: string
  uptime: string
  totalUsers: number
  activeUsers: number
  totalRoles: number
  totalPermissions: number
  userRoleAssignments: number
  microserviceName: string
  microserviceCode: string
  lastCheck: string
}

interface User {
  id: string
  clerk_user_id: string
  email: string
  first_name: string
  last_name: string
  is_active: boolean
  created_at: string
  updated_at: string
  roles?: string[]
  permissions?: string[]
}

interface Role {
  role_name: string
  role_display_name?: string
  description?: string
  user_count: number
  active_user_count?: number
  permissions?: string
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
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchAllData()
  }, [])

  const fetchAllData = async () => {
    console.log("🔄 Fetching all admin data (filtered by microservice)...")
    setLoading(true)
    setError(null)

    try {
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
        setUsers(usersData.usersWithRoles || usersData.users || [])
      } else {
        const errorData = await usersResponse.json()
        console.error("❌ Failed to fetch users:", usersResponse.status)
        console.error("Users error details:", errorData)
      }

      // Fetch roles
      const rolesResponse = await fetch("/api/admin/roles")
      if (rolesResponse.ok) {
        const rolesData = await rolesResponse.json()
        console.log("✅ Roles data:", rolesData)
        // Fix: Use rolesData.roles instead of rolesData.uniqueRoles
        setRoles(rolesData.roles || [])
      } else {
        const errorData = await rolesResponse.json()
        console.error("❌ Failed to fetch roles:", rolesResponse.status)
        console.error("Roles error details:", errorData)
      }

      // Fetch permissions
      const permissionsResponse = await fetch("/api/admin/permissions")
      if (permissionsResponse.ok) {
        const permissionsData = await permissionsResponse.json()
        console.log("✅ Permissions data:", permissionsData)
        setPermissions(permissionsData.permissions || [])
      } else {
        const errorData = await permissionsResponse.json()
        console.error("❌ Failed to fetch permissions:", permissionsResponse.status)
        console.error("Permissions error details:", errorData)
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
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">System Administration</h1>
          <Badge variant="outline">Home Visits Microservice</Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-20" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>

        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>Error loading admin data: {error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">System Administration</h1>
        <Badge variant="outline">{systemStatus?.microserviceName || "Home Visits"} Microservice</Badge>
      </div>

      {/* System Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Database Status</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              {systemStatus?.database === "connected" ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <XCircle className="h-4 w-4 text-red-500" />
              )}
              <span className="text-2xl font-bold capitalize">{systemStatus?.database || "Unknown"}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemStatus?.totalUsers || 0}</div>
            <p className="text-xs text-muted-foreground">{systemStatus?.activeUsers || 0} active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Roles</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemStatus?.totalRoles || 0}</div>
            <p className="text-xs text-muted-foreground">{systemStatus?.userRoleAssignments || 0} assignments</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Permissions</CardTitle>
            <Key className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemStatus?.totalPermissions || 0}</div>
            <p className="text-xs text-muted-foreground">For {systemStatus?.microserviceCode || "home-visits"}</p>
          </CardContent>
        </Card>
      </div>

      {/* System Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Server className="h-5 w-5" />
            <span>System Information</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm font-medium">Environment</p>
              <p className="text-2xl font-bold capitalize">{systemStatus?.environment || "Unknown"}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Version</p>
              <p className="text-2xl font-bold">{systemStatus?.version || "Unknown"}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Uptime</p>
              <p className="text-2xl font-bold">{systemStatus?.uptime || "Unknown"}</p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>
                Last checked: {systemStatus?.lastCheck ? new Date(systemStatus.lastCheck).toLocaleString() : "Unknown"}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Tables */}
      <Tabs defaultValue="users" className="space-y-4">
        <TabsList>
          <TabsTrigger value="users">Users ({users.length})</TabsTrigger>
          <TabsTrigger value="roles">Roles ({roles.length})</TabsTrigger>
          <TabsTrigger value="permissions">Permissions ({permissions.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>System Users</CardTitle>
              <CardDescription>
                All users in the system with their roles for the {systemStatus?.microserviceName || "Home Visits"}{" "}
                microservice
              </CardDescription>
            </CardHeader>
            <CardContent>
              {users.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No users found</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Roles</TableHead>
                      <TableHead>Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">
                          {user.first_name} {user.last_name}
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Badge variant={user.is_active ? "default" : "secondary"}>
                            {user.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {user.roles && user.roles.length > 0 ? (
                              user.roles.map((role, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {role}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-muted-foreground text-sm">No roles</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roles">
          <Card>
            <CardHeader>
              <CardTitle>System Roles</CardTitle>
              <CardDescription>
                All roles defined for the {systemStatus?.microserviceName || "Home Visits"} microservice
              </CardDescription>
            </CardHeader>
            <CardContent>
              {roles.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No roles found</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Role Name</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Users</TableHead>
                      <TableHead>Active Users</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {roles.map((role, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{role.role_name}</TableCell>
                        <TableCell>{role.description || "No description available"}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{role.user_count}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="default">{role.active_user_count || role.user_count}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="permissions">
          <Card>
            <CardHeader>
              <CardTitle>System Permissions</CardTitle>
              <CardDescription>
                All permissions defined for the {systemStatus?.microserviceName || "Home Visits"} microservice
              </CardDescription>
            </CardHeader>
            <CardContent>
              {permissions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No permissions found</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Permission Code</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Description</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {permissions.map((permission) => (
                      <TableRow key={permission.id}>
                        <TableCell className="font-mono text-sm">{permission.permission_code}</TableCell>
                        <TableCell className="font-medium">{permission.permission_name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{permission.category}</Badge>
                        </TableCell>
                        <TableCell>{permission.description}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
