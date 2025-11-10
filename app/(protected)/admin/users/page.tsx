"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, UserPlus, Settings, UserCheck } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"

interface User {
  id: string
  email: string
  first_name: string
  last_name: string
  core_role: string
  is_active: boolean
  created_at: string
  roles: Array<{
    role_name: string
    role_display_name: string
    microservice_name: string
  }>
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [assigningRolesToUser, setAssigningRolesToUser] = useState<User | null>(null)
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false)
  const [availableRoles, setAvailableRoles] = useState<Array<{ role_name: string; role_display_name: string; role_level: number }>>([])
  const { toast } = useToast()

  useEffect(() => {
    fetchUsers()
  }, [])

  useEffect(() => {
    const filtered = users.filter(
      (user) =>
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.last_name.toLowerCase().includes(searchTerm.toLowerCase()),
    )
    setFilteredUsers(filtered)
  }, [users, searchTerm])

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/admin/users")
      if (response.ok) {
        const data = await response.json()
        // Use usersWithRoles if available, otherwise use users
        const usersData = data.usersWithRoles || data.users || []
        // Map to extract roles as string array for compatibility
        const mappedUsers = usersData.map((user: any) => ({
          ...user,
          roles: user.roles || (user.microservice_roles || []).map((r: any) => r.role_name || r),
        }))
        setUsers(mappedUsers)
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch users",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error fetching users:", error)
      toast({
        title: "Error",
        description: "Failed to fetch users",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleUserAction = async (userId: string, action: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: `User ${action} successfully`,
        })
        fetchUsers()
      } else {
        toast({
          title: "Error",
          description: `Failed to ${action} user`,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to ${action} user`,
        variant: "destructive",
      })
    }
  }

  const handleImpersonate = async (userId: string, userName: string) => {
    if (!confirm(`Impersonate ${userName}? You will see the application from their perspective.`)) {
      return
    }

    try {
      const response = await fetch("/api/impersonate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      })

      if (response.ok) {
        toast({
          title: "Impersonation Started",
          description: `Now viewing as ${userName}. Refresh to see their view.`,
        })
        // Reload page after a short delay to show the toast
        setTimeout(() => {
          window.location.reload()
        }, 1000)
      } else {
        const data = await response.json()
        toast({
          title: "Error",
          description: data.error || "Failed to start impersonation",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start impersonation",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="h-12 bg-gray-200 rounded mb-6"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-muted-foreground">Manage system users and their roles</p>
        </div>
        <Button>
          <UserPlus className="h-4 w-4 mr-2" />
          Invite User
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Search Users</CardTitle>
          <CardDescription>Find users by email or name</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Users ({filteredUsers.length})</CardTitle>
          <CardDescription>All registered users in the system</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredUsers.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              {searchTerm ? "No users found matching your search" : "No users found"}
            </p>
          ) : (
            <div className="space-y-4">
              {filteredUsers.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <div className="font-medium">
                        {user.first_name} {user.last_name}
                      </div>
                      <Badge variant={user.is_active ? "default" : "secondary"}>
                        {user.is_active ? "Active" : "Inactive"}
                      </Badge>
                      <Badge variant="outline">{user.core_role}</Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">{user.email}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Joined {new Date(user.created_at).toLocaleDateString()}
                    </div>
                    {user.roles && user.roles.length > 0 && (
                      <div className="flex gap-1 mt-2">
                        {user.roles.map((role, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {role.role_display_name}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleImpersonate(user.id, `${user.first_name} ${user.last_name}`)}
                      className="text-refuge-purple hover:bg-refuge-purple/10 hover:border-refuge-purple/50"
                      title="View application as this user"
                    >
                      <UserCheck className="h-4 w-4 mr-1" />
                      Impersonate
                    </Button>
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
                      title="Assign roles to this user"
                    >
                      <Settings className="h-4 w-4 mr-1" />
                      Roles
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleUserAction(user.id, user.is_active ? "deactivate" : "activate")}
                    >
                      {user.is_active ? "Deactivate" : "Activate"}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Role Assignment Dialog */}
      <Dialog open={isRoleDialogOpen} onOpenChange={setIsRoleDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Assign Roles to {assigningRolesToUser?.first_name} {assigningRolesToUser?.last_name}
            </DialogTitle>
            <DialogDescription>
              Select the roles to assign to this user for the Home Visits microservice
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
              fetchUsers()
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
  currentRoles: string[] | Array<{ role_name: string; role_display_name: string }>
  onClose: () => void
  onSave: () => void
}) {
  // Normalize currentRoles to string array
  const currentRolesArray = useMemo(() => 
    currentRoles.map((r) => (typeof r === "string" ? r : r.role_name)),
    [currentRoles]
  )
  const [selectedRoles, setSelectedRoles] = useState<string[]>(currentRolesArray)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    setSelectedRoles(currentRolesArray)
  }, [currentRolesArray])

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
