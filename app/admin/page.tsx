import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Users, Settings, Database, Shield } from "lucide-react"

export default function AdminPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-center mb-8">Admin Panel</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="flex flex-col items-center text-center p-6">
          <CardHeader>
            <Users className="h-12 w-12 text-primary mb-4" />
            <CardTitle className="text-xl font-semibold">User Management</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">Manage user accounts, roles, and permissions.</p>
            <Button asChild>
              <Link href="/admin/users">Go to Users</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="flex flex-col items-center text-center p-6">
          <CardHeader>
            <Settings className="h-12 w-12 text-primary mb-4" />
            <CardTitle className="text-xl font-semibold">Application Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">Configure global application settings.</p>
            <Button asChild>
              <Link href="/admin/settings">Go to Settings</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="flex flex-col items-center text-center p-6">
          <CardHeader>
            <Database className="h-12 w-12 text-primary mb-4" />
            <CardTitle className="text-xl font-semibold">Database Tools</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">Access database-related utilities and diagnostics.</p>
            <Button asChild>
              <Link href="/test-db">Go to DB Tools</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="flex flex-col items-center text-center p-6">
          <CardHeader>
            <Shield className="h-12 w-12 text-primary mb-4" />
            <CardTitle className="text-xl font-semibold">Security & Access</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">Manage security configurations and access controls.</p>
            <Button asChild>
              <Link href="/admin/security">Go to Security</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
