"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"

type User = {
  id: string
  email: string
  first_name: string
  last_name: string
  core_role: string
  role_name: string
  role_display_name: string
}

type Role = {
  id: string
  role_name: string
  role_display_name: string
}

export function UsersTable({ initialUsers, allRoles }: { initialUsers: User[]; allRoles: Role[] }) {
  const [users, setUsers] = useState(initialUsers)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [selectedRoles, setSelectedRoles] = useState<string[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const router = useRouter()

  const handleManageRoles = (user: User) => {
    setSelectedUser(user)
    // Note: This simplified example assumes one role per user from the initial fetch.
    // A more robust implementation would handle multiple roles.
    setSelectedRoles(user.role_name ? [user.role_name] : [])
  }

  const handleRoleChange = (roleName: string, checked: boolean | "indeterminate") => {
    setSelectedRoles((prev) => {
      if (checked) {
        return [...prev, roleName]
      } else {
        return prev.filter((r) => r !== roleName)
      }
    })
  }

  const handleSaveChanges = async () => {
    if (!selectedUser) return
    setIsSaving(true)

    try {
      const response = await fetch(`/api/admin/users/${selectedUser.id}/roles`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roles: selectedRoles }),
      })

      if (!response.ok) {
        throw new Error("Failed to update roles")
      }

      toast({
        title: "Success",
        description: `Roles for ${selectedUser.email} updated successfully.`,
      })
      // Close dialog and refresh data
      setSelectedUser(null)
      router.refresh()
    } catch (error) {
      console.error(error)
      toast({
        title: "Error",
        description: "Could not update user roles.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Core Role</TableHead>
              <TableHead>Application Role</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  {user.first_name} {user.last_name}
                </TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <Badge variant="secondary">{user.core_role}</Badge>
                </TableCell>
                <TableCell>
                  {user.role_display_name ? (
                    <Badge>{user.role_display_name}</Badge>
                  ) : (
                    <span className="text-muted-foreground">No Role</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <Dialog onOpenChange={(open) => !open && setSelectedUser(null)}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" onClick={() => handleManageRoles(user)}>
                        Manage Roles
                      </Button>
                    </DialogTrigger>
                    {selectedUser && selectedUser.id === user.id && (
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Manage Roles for {selectedUser.email}</DialogTitle>
                          <DialogDescription>
                            Assign roles to this user for the Home Visits application.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          {allRoles.map((role) => (
                            <div key={role.id} className="flex items-center space-x-2">
                              <Checkbox
                                id={role.role_name}
                                checked={selectedRoles.includes(role.role_name)}
                                onCheckedChange={(checked) => handleRoleChange(role.role_name, checked)}
                              />
                              <Label htmlFor={role.role_name} className="font-medium">
                                {role.role_display_name}
                              </Label>
                            </div>
                          ))}
                        </div>
                        <DialogFooter>
                          <Button variant="ghost" onClick={() => setSelectedUser(null)}>
                            Cancel
                          </Button>
                          <Button onClick={handleSaveChanges} disabled={isSaving}>
                            {isSaving ? "Saving..." : "Save Changes"}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    )}
                  </Dialog>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  )
}
