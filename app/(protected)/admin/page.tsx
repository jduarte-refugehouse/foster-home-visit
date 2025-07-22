"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Users, Settings, Shield, Database, Activity, AlertTriangle } from "lucide-react"
import Link from "next/link"

export const dynamic = "force-dynamic"

export default function AdminPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Admin Panel</h1>
        <p className="text-muted-foreground">System administration and management tools</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24</div>
            <p className="text-xs text-muted-foreground">Active system users</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Health</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">99.9%</div>
            <p className="text-xs text-muted-foreground">Uptime this month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Database Size</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2.4 GB</div>
            <p className="text-xs text-muted-foreground">Storage used</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">3</div>
            <p className="text-xs text-muted-foreground">Require attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Admin Tools */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="w-5 h-5 mr-2 text-blue-600" />
              User Management
            </CardTitle>
            <CardDescription>Manage user accounts, roles, and permissions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span>Active Users</span>
                <Badge variant="default">24</Badge>
              </div>
              <div className="flex justify-between text-sm">
                <span>Pending Invitations</span>
                <Badge variant="secondary">3</Badge>
              </div>
            </div>
            <Link href="/admin/invitations">
              <Button className="w-full">Manage Users</Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Settings className="w-5 h-5 mr-2 text-green-600" />
              System Settings
            </CardTitle>
            <CardDescription>Configure system-wide settings and preferences</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span>Configuration</span>
                <Badge variant="outline">Updated</Badge>
              </div>
              <div className="flex justify-between text-sm">
                <span>Maintenance Mode</span>
                <Badge variant="secondary">Off</Badge>
              </div>
            </div>
            <Button className="w-full bg-transparent" variant="outline">
              System Settings
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Shield className="w-5 h-5 mr-2 text-red-600" />
              Security & Audit
            </CardTitle>
            <CardDescription>Monitor security events and audit logs</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span>Failed Logins</span>
                <Badge variant="destructive">2</Badge>
              </div>
              <div className="flex justify-between text-sm">
                <span>Security Score</span>
                <Badge variant="default">A+</Badge>
              </div>
            </div>
            <Button className="w-full bg-transparent" variant="outline">
              Security Dashboard
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Database className="w-5 h-5 mr-2 text-purple-600" />
              Database Management
            </CardTitle>
            <CardDescription>Monitor and manage database operations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span>Connection Status</span>
                <Badge variant="default">Connected</Badge>
              </div>
              <div className="flex justify-between text-sm">
                <span>Last Backup</span>
                <Badge variant="secondary">2h ago</Badge>
              </div>
            </div>
            <Link href="/diagnostics">
              <Button className="w-full bg-transparent" variant="outline">
                Database Tools
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="w-5 h-5 mr-2 text-orange-600" />
              System Monitoring
            </CardTitle>
            <CardDescription>View system performance and health metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span>CPU Usage</span>
                <Badge variant="default">23%</Badge>
              </div>
              <div className="flex justify-between text-sm">
                <span>Memory Usage</span>
                <Badge variant="secondary">45%</Badge>
              </div>
            </div>
            <Button className="w-full bg-transparent" variant="outline">
              View Metrics
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2 text-yellow-600" />
              Alerts & Notifications
            </CardTitle>
            <CardDescription>Manage system alerts and notification settings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span>Active Alerts</span>
                <Badge variant="destructive">3</Badge>
              </div>
              <div className="flex justify-between text-sm">
                <span>Email Notifications</span>
                <Badge variant="default">On</Badge>
              </div>
            </div>
            <Button className="w-full bg-transparent" variant="outline">
              Manage Alerts
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
