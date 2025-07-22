import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { UsersTable } from "@/components/admin/users-table"
import { getUsersWithRolesAndPermissions, getAllDefinedRoles } from "@/lib/user-management"

export const dynamic = "force-dynamic"

export default async function AdminUsersPage() {
  const users = await getUsersWithRolesAndPermissions()
  const roles = await getAllDefinedRoles()

  return (
    <main className="container mx-auto py-8 px-4">
      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
          <CardDescription>View users and manage their roles within the Home Visits application.</CardDescription>
        </CardHeader>
        <CardContent>
          <UsersTable initialUsers={users} allRoles={roles} />
        </CardContent>
      </Card>
    </main>
  )
}
