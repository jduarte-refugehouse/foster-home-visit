import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Users, Settings, BarChart, Shield, ArrowLeft } from "lucide-react"
import Image from "next/image"

const LOGO_SRC = "/images/web logo with name.png"

export default function AdminDashboard() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      {/* Header */}
      <header className="px-4 lg:px-6 h-14 flex items-center justify-between bg-white border-b border-gray-200">
        <div className="flex items-center space-x-4">
          <Link href="/">
            <Button variant="ghost">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>
          <div className="flex items-center space-x-2">
            <Image
              src={LOGO_SRC || "/placeholder.svg"}
              alt="Family Visits Pro Logo"
              width={180}
              height={36}
              className="h-auto"
            />
            <span className="text-lg font-semibold text-gray-900">Admin Dashboard</span>
          </div>
        </div>
        <nav className="ml-auto flex gap-4 sm:gap-6">
          <Link className="text-sm font-medium hover:underline underline-offset-4 text-gray-600" href="/features">
            Features
          </Link>
          <Link className="text-sm font-medium hover:underline underline-offset-4 text-gray-600" href="/solutions">
            Solutions
          </Link>
          <Link className="text-sm font-medium hover:underline underline-offset-4 text-gray-600" href="/contact">
            Contact
          </Link>
          <Link className="text-sm font-medium hover:underline underline-offset-4 text-gray-600" href="/admin">
            Admin
          </Link>
        </nav>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Administrator Panel</h1>
            <p className="text-lg text-gray-600 max-w-xl mx-auto">
              Manage users, system settings, and monitor application health.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {/* User Management Card */}
            <Card>
              <CardHeader>
                <Users className="w-8 h-8 text-refuge-purple mb-2" />
                <CardTitle>User Management</CardTitle>
                <CardDescription>Add, edit, and manage user accounts and roles.</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                  <li>Create new staff accounts</li>
                  <li>Assign roles and permissions</li>
                  <li>Reset passwords</li>
                  <li>View user activity logs</li>
                </ul>
                <Button variant="outline" className="mt-4 bg-transparent">
                  Manage Users
                </Button>
              </CardContent>
            </Card>

            {/* System Settings Card */}
            <Card>
              <CardHeader>
                <Settings className="w-8 h-8 text-refuge-green mb-2" />
                <CardTitle>System Settings</CardTitle>
                <CardDescription>Configure application-wide parameters.</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                  <li>Update organization details</li>
                  <li>Manage notification preferences</li>
                  <li>Configure integration settings</li>
                  <li>Set default visit parameters</li>
                </ul>
                <Button variant="outline" className="mt-4 bg-transparent">
                  Configure Settings
                </Button>
              </CardContent>
            </Card>

            {/* Reports & Analytics Card */}
            <Card>
              <CardHeader>
                <BarChart className="w-8 h-8 text-refuge-blue mb-2" />
                <CardTitle>Reports & Analytics</CardTitle>
                <CardDescription>Access detailed reports on visits, clients, and staff performance.</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                  <li>Generate custom visit reports</li>
                  <li>Analyze client engagement trends</li>
                  <li>Monitor staff workload and efficiency</li>
                  <li>Export data for external analysis</li>
                </ul>
                <Button variant="outline" className="mt-4 bg-transparent">
                  View Reports
                </Button>
              </CardContent>
            </Card>

            {/* Security & Compliance Card */}
            <Card>
              <CardHeader>
                <Shield className="w-8 h-8 text-refuge-yellow mb-2" />
                <CardTitle>Security & Compliance</CardTitle>
                <CardDescription>Ensure your application meets all security and regulatory standards.</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                  <li>Review audit logs</li>
                  <li>Manage data retention policies</li>
                  <li>Configure access controls</li>
                  <li>Monitor HIPAA compliance status</li>
                </ul>
                <Button variant="outline" className="mt-4 bg-transparent">
                  Manage Security
                </Button>
              </CardContent>
            </Card>

            {/* Database & Proxy Status Card */}
            <Card>
              <CardHeader>
                <Settings className="w-8 h-8 text-refuge-red mb-2" />
                <CardTitle>Database & Proxy Status</CardTitle>
                <CardDescription>
                  Check the health and configuration of your database and proxy connections.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                  <li>Verify database connectivity</li>
                  <li>Monitor proxy health</li>
                  <li>View current outbound IP</li>
                  <li>Troubleshoot connection issues</li>
                </ul>
                <Button asChild variant="outline" className="mt-4 bg-transparent">
                  <Link href="/diagnostics">Run Diagnostics</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-4 lg:px-6 h-14 flex items-center justify-center bg-white border-t border-gray-200 text-sm text-gray-600">
        <p>&copy; 2024 Family Visits Pro. All rights reserved.</p>
      </footer>
    </div>
  )
}
