"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@refugehouse/shared-core/components/ui/card"
import { Users } from "lucide-react"

export default function UserAdminPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">User Administration</h1>
        <p className="text-muted-foreground mt-2">
          Manage users across all microservices
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            User Management
          </CardTitle>
          <CardDescription>
            View and manage user accounts, roles, and permissions across all microservices
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            User administration interface coming soon. This will allow you to:
          </p>
          <ul className="list-disc list-inside mt-2 text-sm text-muted-foreground space-y-1">
            <li>View all users across microservices</li>
            <li>Assign roles and permissions</li>
            <li>Manage user access by microservice</li>
            <li>View user activity and audit logs</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}

