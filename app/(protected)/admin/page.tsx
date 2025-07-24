"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, Settings, Database } from "lucide-react"
import Link from "next/link"

export const dynamic = "force-dynamic"

export default function AdminPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Administration</h1>
        <p className="text-muted-foreground">Administrative tools and system management</p>
      </div>

      {/* Available Admin Tools */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="w-5 h-5 mr-2 text-blue-600" />
              User Invitations
            </CardTitle>
            <CardDescription>Manage user invitations and access</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Send invitations to new users and manage pending invitations.
            </p>
            <Link href="/admin/invitations">
              <Button className="w-full">Manage Invitations</Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Settings className="w-5 h-5 mr-2 text-green-600" />
              System Administration
            </CardTitle>
            <CardDescription>Advanced system configuration and monitoring</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Access system-wide settings and administrative functions.
            </p>
            <Link href="/system-admin">
              <Button className="w-full bg-transparent" variant="outline">
                System Admin
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Database className="w-5 h-5 mr-2 text-purple-600" />
              Database Diagnostics
            </CardTitle>
            <CardDescription>Monitor database health and performance</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              View database connection status and run diagnostic tests.
            </p>
            <Link href="/diagnostics">
              <Button className="w-full bg-transparent" variant="outline">
                Database Tools
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
