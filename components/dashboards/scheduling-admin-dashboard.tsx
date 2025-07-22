"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, Home, Plus, AlertCircle } from "lucide-react"

export function SchedulingAdminDashboard() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Scheduling Dashboard</h1>
          <p className="text-muted-foreground">Manage home visit schedules and appointments</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Schedule Visit
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Today's Visits</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <div className="text-xs text-muted-foreground">+2 from yesterday</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">This Week</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">34</div>
            <div className="text-xs text-muted-foreground">5 pending confirmation</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Overdue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">3</div>
            <div className="text-xs text-muted-foreground">Require rescheduling</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Completion Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">94%</div>
            <div className="text-xs text-muted-foreground">This month</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Visits */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              Upcoming Visits
            </CardTitle>
            <CardDescription>Next 7 days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { home: "Johnson Family", time: "10:00 AM", date: "Today", status: "confirmed" },
                { home: "Smith Residence", time: "2:30 PM", date: "Today", status: "pending" },
                { home: "Davis Home", time: "9:00 AM", date: "Tomorrow", status: "confirmed" },
                { home: "Wilson Family", time: "11:30 AM", date: "Tomorrow", status: "overdue" },
              ].map((visit, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Home className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium">{visit.home}</div>
                      <div className="text-sm text-muted-foreground">
                        {visit.date} at {visit.time}
                      </div>
                    </div>
                  </div>
                  <Badge
                    variant={
                      visit.status === "confirmed"
                        ? "default"
                        : visit.status === "pending"
                          ? "secondary"
                          : "destructive"
                    }
                  >
                    {visit.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Schedule Conflicts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertCircle className="h-5 w-5 mr-2" />
              Schedule Conflicts
            </CardTitle>
            <CardDescription>Require attention</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                {
                  issue: "Double booking",
                  description: "Gabe has two visits at 2:00 PM on Friday",
                  priority: "high",
                },
                {
                  issue: "Travel time conflict",
                  description: "15 minutes between visits 20 miles apart",
                  priority: "medium",
                },
                {
                  issue: "Liaison unavailable",
                  description: "No coverage for Thursday afternoon visits",
                  priority: "high",
                },
              ].map((conflict, index) => (
                <div key={index} className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-medium">{conflict.issue}</div>
                    <Badge variant={conflict.priority === "high" ? "destructive" : "secondary"}>
                      {conflict.priority}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">{conflict.description}</div>
                  <Button size="sm" variant="outline" className="mt-2 bg-transparent">
                    Resolve
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
