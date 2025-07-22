"use client"

import { useUser } from "@clerk/nextjs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Users, UserPlus, Settings, Database, Shield, Activity, AlertCircle } from "lucide-react"
import Link from "next/link"

export default function AdminPage() {
  const { isSignedIn, isLoaded, user } = useUser()

  if (!isLoaded) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-4 w-48" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-10 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!isSignedIn) {
    return (
      <div className="container mx-auto px-4 py-12">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-500" />
              Authentication Required
            </CardTitle>
            <CardDescription>You need to be signed in to access admin functions.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">Please sign in to access the admin panel.</p>
            <Link href="/sign-in">
              <Button className="w-full">Sign In</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const adminSections = [
    {
      title: "User Management",
      description: "Manage user accounts, roles, and permissions",
      icon: Users,
      href: "/admin/users",
      status: "Active",
      actions: ["View Users", "Edit Roles", "Deactivate Accounts"],
    },
    {
      title: "Invitations",
      description: "Send invitations and manage user access",
      icon: UserPlus,
      href: "/admin/invitations",
      status: "Active",
      actions: ["Send Invites", "View Pending", "Manage Access"],
    },
    {
      title: "System Settings",
      description: "Configure application settings and preferences",
      icon: Settings,
      href: "/admin/settings",
      status: "Active",
      actions: ["App Config", "Notifications", "Integrations"],
    },
    {
      title: "Database Management",
      description: "Monitor database health and perform maintenance",
      icon: Database,
      href: "/admin/database",
      status: "Active",
      actions: ["View Stats", "Run Maintenance", "Backup Data"],
    },
    {
      title: "Security & Audit",
      description: "Review security logs and audit trails",
      icon: Shield,
      href: "/admin/security",
      status: "Active",
      actions: ["View Logs", "Security Reports", "Access Control"],
    },
    {
      title: "System Monitoring",
      description: "Monitor system performance and health",
      icon: Activity,
      href: "/admin/monitoring",
      status: "Active",
      actions: ["Performance", "Error Logs", "Health Checks"],
    },
  ]

  const quickStats = [
    { label: "Total Users", value: "24", change: "+3 this month" },
    { label: "Active Sessions", value: "8", change: "Currently online" },
    { label: "System Health", value: "98%", change: "All systems operational" },
    { label: "Data Backup", value: "2h ago", change: "Last successful backup" },
  ]

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Admin Panel</h1>
        <p className="text-gray-600">System administration and management tools</p>
      </div>

      {/* Quick Stats */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {quickStats.map((stat, index) => (
          <Card key={index}>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-sm font-medium text-gray-600">{stat.label}</p>
              <p className="text-xs text-gray-500 mt-1">{stat.change}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Admin Sections */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {adminSections.map((section, index) => (
          <Card key={index} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between mb-2">
                <section.icon className="h-8 w-8 text-blue-600" />
                <Badge variant="default">{section.status}</Badge>
              </div>
              <CardTitle className="text-xl">{section.title}</CardTitle>
              <CardDescription>{section.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="text-sm text-gray-600">
                  <strong>Available Actions:</strong>
                  <ul className="mt-1 space-y-1">
                    {section.actions.map((action, actionIndex) => (
                      <li key={actionIndex} className="flex items-center">
                        <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mr-2" />
                        {action}
                      </li>
                    ))}
                  </ul>
                </div>
                <Button className="w-full" asChild>
                  <Link href={section.href} prefetch={false}>
                    Access {section.title}
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Recent Admin Activity</CardTitle>
            <CardDescription>Latest administrative actions and system events</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <UserPlus className="h-5 w-5 text-green-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium">New user invitation sent</p>
                  <p className="text-xs text-gray-500">2 hours ago</p>
                </div>
                <Badge variant="outline">User Management</Badge>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <Database className="h-5 w-5 text-blue-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Database backup completed</p>
                  <p className="text-xs text-gray-500">4 hours ago</p>
                </div>
                <Badge variant="outline">System</Badge>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <Shield className="h-5 w-5 text-purple-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Security audit completed</p>
                  <p className="text-xs text-gray-500">1 day ago</p>
                </div>
                <Badge variant="outline">Security</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
