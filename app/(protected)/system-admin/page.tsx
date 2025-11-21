"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@refugehouse/shared-core/components/ui/card"
import { Badge } from "@refugehouse/shared-core/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@refugehouse/shared-core/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@refugehouse/shared-core/components/ui/tabs"
import { Alert, AlertDescription } from "@refugehouse/shared-core/components/ui/alert"
import { Skeleton } from "@refugehouse/shared-core/components/ui/skeleton"
import { CheckCircle, XCircle, Users, Shield, Key, Database, Clock, Server, Menu, Plus, Edit, Trash2, Eye, EyeOff, UserPlus } from "lucide-react"
import { Button } from "@refugehouse/shared-core/components/ui/button"
import { Input } from "@refugehouse/shared-core/components/ui/input"
import { Label } from "@refugehouse/shared-core/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@refugehouse/shared-core/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@refugehouse/shared-core/components/ui/select"
import { Checkbox } from "@refugehouse/shared-core/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"

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

interface NavigationItem {
  id: string
  code: string
  title: string
  url: string
  icon: string
  permissionRequired: string | null
  permissionId: string | null
  category: string
  orderIndex: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export default function SystemAdminPage() {
  const searchParams = useSearchParams()
  const sectionParam = searchParams.get('section') || null
  
  // Map section parameter to tab value
  const getDefaultTab = (): string => {
    if (sectionParam === 'user-admin') return 'users'
    if (sectionParam === 'system-config') return 'navigation'
    return 'users' // Default to users tab
  }
  
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [navigationItems, setNavigationItems] = useState<NavigationItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingNavItem, setEditingNavItem] = useState<NavigationItem | null>(null)
  const [isNavDialogOpen, setIsNavDialogOpen] = useState(false)
  const [assigningRolesToUser, setAssigningRolesToUser] = useState<User | null>(null)
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false)
  const [availableRoles, setAvailableRoles] = useState<Array<{ role_name: string; role_display_name: string; role_level: number }>>([])
  const { toast } = useToast()

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

      // Fetch navigation items
      const navItemsResponse = await fetch("/api/admin/navigation-items")
      if (navItemsResponse.ok) {
        const navItemsData = await navItemsResponse.json()
        console.log("✅ Navigation items data:", navItemsData)
        setNavigationItems(navItemsData.navigationItems || [])
      } else {
        const errorData = await navItemsResponse.json()
        console.error("❌ Failed to fetch navigation items:", navItemsResponse.status)
        console.error("Navigation items error details:", errorData)
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
      <Tabs defaultValue={getDefaultTab()} className="space-y-4">
        <TabsList>
          <TabsTrigger value="users">Users ({users.length})</TabsTrigger>
          <TabsTrigger value="roles">Roles ({roles.length})</TabsTrigger>
          <TabsTrigger value="permissions">Permissions ({permissions.length})</TabsTrigger>
          <TabsTrigger value="navigation">Navigation ({navigationItems.length})</TabsTrigger>
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
                      <TableHead>Actions</TableHead>
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
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={async () => {
                              setAssigningRolesToUser(user)
                              setIsRoleDialogOpen(true)
                              // Fetch available roles
                              try {
                                const response = await fetch("/api/admin/roles")
                                if (response.ok) {
                                  const data = await response.json()
                                  setAvailableRoles(data.roles || [])
                                }
                              } catch (error) {
                                console.error("Error fetching roles:", error)
                              }
                            }}
                          >
                            <UserPlus className="h-4 w-4 mr-1" />
                            Assign Roles
                          </Button>
                        </TableCell>
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
                All permissions defined for the {systemStatus?.microserviceName || "Home Visits"} microservice.
                Permissions can be assigned to navigation items to control menu visibility.
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
                      <TableHead>Used In Navigation</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {permissions.map((permission) => {
                      const navItemsUsingPermission = navigationItems.filter(
                        (item) => item.permissionRequired === permission.permission_code
                      )
                      return (
                        <TableRow key={permission.id}>
                          <TableCell className="font-mono text-sm">{permission.permission_code}</TableCell>
                          <TableCell className="font-medium">{permission.permission_name}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{permission.category}</Badge>
                          </TableCell>
                          <TableCell>{permission.description}</TableCell>
                          <TableCell>
                            {navItemsUsingPermission.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {navItemsUsingPermission.map((item) => (
                                  <Badge key={item.id} variant="secondary" className="text-xs">
                                    {item.title}
                                  </Badge>
                                ))}
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-sm">Not used</span>
                            )}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="navigation">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Navigation Items</CardTitle>
                  <CardDescription>
                    Manage menu items for the {systemStatus?.microserviceName || "Home Visits"} microservice
                  </CardDescription>
                </div>
                <Dialog open={isNavDialogOpen} onOpenChange={setIsNavDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={() => setEditingNavItem(null)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Item
                    </Button>
                  </DialogTrigger>
                  <NavigationItemDialog
                    item={editingNavItem}
                    permissions={permissions}
                    onClose={() => {
                      setIsNavDialogOpen(false)
                      setEditingNavItem(null)
                    }}
                    onSave={() => {
                      fetchAllData()
                      setIsNavDialogOpen(false)
                      setEditingNavItem(null)
                    }}
                  />
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {navigationItems.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No navigation items found</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>URL</TableHead>
                      <TableHead>Icon</TableHead>
                      <TableHead>Permission</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Order</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {navigationItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.title}</TableCell>
                        <TableCell className="font-mono text-sm">{item.url}</TableCell>
                        <TableCell>{item.icon}</TableCell>
                        <TableCell>
                          {item.permissionRequired ? (
                            <Badge variant="outline">{item.permissionRequired}</Badge>
                          ) : (
                            <span className="text-muted-foreground text-sm">No permission</span>
                          )}
                        </TableCell>
                        <TableCell>{item.category}</TableCell>
                        <TableCell>{item.orderIndex}</TableCell>
                        <TableCell>
                          <Badge variant={item.isActive ? "default" : "secondary"}>
                            {item.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditingNavItem(item)
                                setIsNavDialogOpen(true)
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={async () => {
                                try {
                                  const response = await fetch(`/api/admin/navigation-items/${item.id}`, {
                                    method: "PATCH",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({ isActive: !item.isActive }),
                                  })
                                  if (response.ok) {
                                    toast({
                                      title: "Success",
                                      description: `Navigation item ${item.isActive ? "deactivated" : "activated"}`,
                                    })
                                    fetchAllData()
                                  }
                                } catch (error) {
                                  toast({
                                    title: "Error",
                                    description: "Failed to update navigation item",
                                    variant: "destructive",
                                  })
                                }
                              }}
                            >
                              {item.isActive ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Role Assignment Dialog */}
      <Dialog open={isRoleDialogOpen} onOpenChange={setIsRoleDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Assign Roles to {assigningRolesToUser?.first_name} {assigningRolesToUser?.last_name}
            </DialogTitle>
            <DialogDescription>
              Select the roles to assign to this user for the {systemStatus?.microserviceName || "Home Visits"} microservice
            </DialogDescription>
          </DialogHeader>
          <RoleAssignmentDialog
            user={assigningRolesToUser}
            availableRoles={availableRoles}
            currentRoles={assigningRolesToUser?.roles || []}
            onClose={() => {
              setIsRoleDialogOpen(false)
              setAssigningRolesToUser(null)
            }}
            onSave={() => {
              fetchAllData()
              setIsRoleDialogOpen(false)
              setAssigningRolesToUser(null)
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Role Assignment Dialog Component
function RoleAssignmentDialog({
  user,
  availableRoles,
  currentRoles,
  onClose,
  onSave,
}: {
  user: User | null
  availableRoles: Array<{ role_name: string; role_display_name: string; role_level: number }>
  currentRoles: string[]
  onClose: () => void
  onSave: () => void
}) {
  const [selectedRoles, setSelectedRoles] = useState<string[]>(currentRoles)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    setSelectedRoles(currentRoles)
  }, [currentRoles])

  const handleRoleToggle = (roleName: string) => {
    setSelectedRoles((prev) =>
      prev.includes(roleName) ? prev.filter((r) => r !== roleName) : [...prev, roleName]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setLoading(true)
    try {
      const response = await fetch(`/api/admin/users/${user.id}/roles`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roles: selectedRoles }),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "User roles updated successfully",
        })
        onSave()
      } else {
        const errorData = await response.json()
        toast({
          title: "Error",
          description: errorData.error || "Failed to update user roles",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update user roles",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-4 py-4 max-h-[400px] overflow-y-auto">
        {availableRoles.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">No roles available</div>
        ) : (
          <div className="space-y-2">
            {availableRoles.map((role) => (
              <div key={role.role_name} className="flex items-center space-x-2 p-2 rounded hover:bg-slate-50">
                <Checkbox
                  id={`role-${role.role_name}`}
                  checked={selectedRoles.includes(role.role_name)}
                  onCheckedChange={() => handleRoleToggle(role.role_name)}
                />
                <label
                  htmlFor={`role-${role.role_name}`}
                  className="flex-1 cursor-pointer text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  <div className="flex items-center justify-between">
                    <span>{role.role_display_name}</span>
                    <Badge variant="outline" className="text-xs">
                      Level {role.role_level}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{role.role_name}</p>
                </label>
              </div>
            ))}
          </div>
        )}
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? "Saving..." : "Save Roles"}
        </Button>
      </DialogFooter>
    </form>
  )
}

// Navigation Item Dialog Component
function NavigationItemDialog({
  item,
  permissions,
  onClose,
  onSave,
}: {
  item: NavigationItem | null
  permissions: Permission[]
  onClose: () => void
  onSave: () => void
}) {
  const [formData, setFormData] = useState<{
    code: string
    title: string
    url: string
    icon: string
    permissionRequired: string | null
    category: string
    orderIndex: number
    isActive: boolean
  }>({
    code: item?.code || "",
    title: item?.title || "",
    url: item?.url || "",
    icon: item?.icon || "",
    permissionRequired: item?.permissionRequired || null,
    category: item?.category || "Navigation",
    orderIndex: item?.orderIndex || 0,
    isActive: item?.isActive ?? true,
  })
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const url = item ? `/api/admin/navigation-items/${item.id}` : "/api/admin/navigation-items"
      const method = item ? "PATCH" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: item ? "Navigation item updated" : "Navigation item created",
        })
        onSave()
      } else {
        const errorData = await response.json()
        toast({
          title: "Error",
          description: errorData.error || "Failed to save navigation item",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save navigation item",
        variant: "destructive",
      })
    }
  }

  return (
    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>{item ? "Edit Navigation Item" : "Add Navigation Item"}</DialogTitle>
        <DialogDescription>
          {item ? "Update the navigation item details" : "Create a new navigation item for the menu"}
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="code">Code *</Label>
            <Input
              id="code"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              required
              disabled={!!item}
              placeholder="e.g., visits_list"
            />
            <p className="text-xs text-muted-foreground mt-1">Unique identifier (lowercase, underscores)</p>
          </div>
          <div>
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              placeholder="e.g., Visits List"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="url">URL *</Label>
          <Input
            id="url"
            value={formData.url}
            onChange={(e) => setFormData({ ...formData, url: e.target.value })}
            required
            placeholder="e.g., /visits-list"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="icon">Icon *</Label>
            <Input
              id="icon"
              value={formData.icon}
              onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
              required
              placeholder="e.g., List"
            />
            <p className="text-xs text-muted-foreground mt-1">Lucide icon name (PascalCase)</p>
          </div>
          <div>
            <Label htmlFor="category">Category *</Label>
            <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Navigation">Navigation</SelectItem>
                <SelectItem value="Administration">Administration</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label htmlFor="permissionRequired">Permission Required</Label>
          <Select
            value={formData.permissionRequired || ""}
            onValueChange={(value) => setFormData({ ...formData, permissionRequired: value === "" ? null : value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a permission (optional)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">No permission required</SelectItem>
              {permissions.map((perm) => (
                <SelectItem key={perm.id} value={perm.permission_code}>
                  {perm.permission_name} ({perm.permission_code})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground mt-1">
            Users need this permission to see this menu item
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="orderIndex">Order Index</Label>
            <Input
              id="orderIndex"
              type="number"
              value={formData.orderIndex}
              onChange={(e) => setFormData({ ...formData, orderIndex: parseInt(e.target.value) || 0 })}
              min="0"
            />
            <p className="text-xs text-muted-foreground mt-1">Lower numbers appear first</p>
          </div>
          <div className="flex items-center space-x-2 pt-6">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="rounded"
            />
            <Label htmlFor="isActive" className="cursor-pointer">
              Active (visible in menu)
            </Label>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">{item ? "Update" : "Create"}</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  )
}
