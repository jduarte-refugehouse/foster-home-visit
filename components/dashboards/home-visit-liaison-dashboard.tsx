"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MapPin, Clock, FileText, Car } from "lucide-react"

export function HomeVisitLiaisonDashboard() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Visit Liaison Dashboard</h1>
          <p className="text-muted-foreground">Manage your home visits and reports</p>
        </div>
        <Button>
          <FileText className="h-4 w-4 mr-2" />
          Start Visit Report
        </Button>
      </div>

      {/* Visit Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Today's Visits</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4</div>
            <div className="text-xs text-muted-foreground">2 completed, 2 remaining</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">This Week</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">18</div>
            <div className="text-xs text-muted-foreground">3 pending reports</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Travel Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2.5h</div>
            <div className="text-xs text-muted-foreground">Average per day</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Completion Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">96%</div>
            <div className="text-xs text-muted-foreground">This month</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Schedule */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="h-5 w-5 mr-2" />
              Today's Schedule
            </CardTitle>
            <CardDescription>Your visits for today</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                {
                  time: "9:00 AM",
                  home: "Johnson Family",
                  address: "123 Oak Street",
                  status: "completed",
                  type: "Routine Check",
                },
                {
                  time: "11:30 AM",
                  home: "Smith Residence",
                  address: "456 Pine Avenue",
                  status: "completed",
                  type: "Follow-up",
                },
                {
                  time: "2:00 PM",
                  home: "Davis Home",
                  address: "789 Maple Drive",
                  status: "upcoming",
                  type: "Initial Visit",
                },
                {
                  time: "4:30 PM",
                  home: "Wilson Family",
                  address: "321 Elm Street",
                  status: "upcoming",
                  type: "Safety Check",
                },
              ].map((visit, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="text-sm font-medium text-muted-foreground">{visit.time}</div>
                    <div>
                      <div className="font-medium">{visit.home}</div>
                      <div className="text-sm text-muted-foreground">
                        {visit.address} • {visit.type}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={visit.status === "completed" ? "default" : "secondary"}>{visit.status}</Badge>
                    {visit.status === "upcoming" && (
                      <Button size="sm" variant="outline">
                        <MapPin className="h-3 w-3 mr-1" />
                        Navigate
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Pending Reports */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              Pending Reports
            </CardTitle>
            <CardDescription>Visits needing documentation</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                {
                  home: "Brown Residence",
                  date: "Yesterday",
                  type: "Routine Check",
                  priority: "high",
                  dueDate: "Due today",
                },
                {
                  home: "Taylor Home",
                  date: "2 days ago",
                  type: "Follow-up",
                  priority: "medium",
                  dueDate: "Due tomorrow",
                },
                {
                  home: "Anderson Family",
                  date: "3 days ago",
                  type: "Initial Visit",
                  priority: "normal",
                  dueDate: "Due in 2 days",
                },
              ].map((report, index) => (
                <div key={index} className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-medium">{report.home}</div>
                    <Badge
                      variant={
                        report.priority === "high"
                          ? "destructive"
                          : report.priority === "medium"
                            ? "secondary"
                            : "outline"
                      }
                    >
                      {report.priority}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground mb-2">
                    {report.type} • {report.date}
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-muted-foreground">{report.dueDate}</div>
                    <Button size="sm" variant="outline">
                      Complete Report
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks and shortcuts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" className="h-20 flex-col bg-transparent">
              <FileText className="h-6 w-6 mb-2" />
              Start New Report
            </Button>
            <Button variant="outline" className="h-20 flex-col bg-transparent">
              <MapPin className="h-6 w-6 mb-2" />
              View Route Map
            </Button>
            <Button variant="outline" className="h-20 flex-col bg-transparent">
              <Car className="h-6 w-6 mb-2" />
              Log Mileage
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
