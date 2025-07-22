"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Home, Users, Calendar, TrendingUp, AlertTriangle } from "lucide-react"

export const dynamic = "force-dynamic"

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Overview of your foster home management system</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Homes</CardTitle>
            <Home className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">127</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+2.1%</span> from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Families</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">89</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+5.2%</span> from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Visits</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">23</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-orange-600">+12.3%</span> from last week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Compliance Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">94.2%</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+1.2%</span> from last month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Visits</CardTitle>
            <CardDescription>Latest home visits and inspections</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { home: "Johnson Family Home", date: "2024-01-15", status: "Completed" },
              { home: "Smith Foster Care", date: "2024-01-14", status: "In Progress" },
              { home: "Davis Residence", date: "2024-01-13", status: "Scheduled" },
              { home: "Wilson Family", date: "2024-01-12", status: "Completed" },
            ].map((visit, index) => (
              <div key={index} className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{visit.home}</p>
                  <p className="text-sm text-muted-foreground">{visit.date}</p>
                </div>
                <Badge
                  variant={
                    visit.status === "Completed" ? "default" : visit.status === "In Progress" ? "secondary" : "outline"
                  }
                >
                  {visit.status}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Alerts & Notifications</CardTitle>
            <CardDescription>Important updates and reminders</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { message: "3 homes require compliance review", type: "warning", time: "2 hours ago" },
              { message: "New family application received", type: "info", time: "4 hours ago" },
              { message: "Monthly report is ready", type: "success", time: "1 day ago" },
              { message: "System maintenance scheduled", type: "info", time: "2 days ago" },
            ].map((alert, index) => (
              <div key={index} className="flex items-start space-x-3">
                <AlertTriangle
                  className={`h-4 w-4 mt-0.5 ${
                    alert.type === "warning"
                      ? "text-orange-500"
                      : alert.type === "success"
                        ? "text-green-500"
                        : "text-blue-500"
                  }`}
                />
                <div className="flex-1">
                  <p className="text-sm font-medium">{alert.message}</p>
                  <p className="text-xs text-muted-foreground">{alert.time}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
