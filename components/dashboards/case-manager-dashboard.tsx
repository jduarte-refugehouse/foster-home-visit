"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FileText, Calendar, AlertCircle } from "lucide-react"

export default function CaseManagerDashboard() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Case Management Dashboard</h1>
          <p className="text-muted-foreground">Monitor your assigned cases and visit reports</p>
        </div>
        <Button>
          <FileText className="h-4 w-4 mr-2" />
          New Case Note
        </Button>
      </div>

      {/* Case Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Cases</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">23</div>
            <div className="text-xs text-muted-foreground">2 new this week</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Reviews</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">7</div>
            <div className="text-xs text-muted-foreground">Visit reports to review</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Overdue Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">3</div>
            <div className="text-xs text-muted-foreground">Require immediate attention</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">18</div>
            <div className="text-xs text-muted-foreground">Cases closed successfully</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Visit Reports */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              Recent Visit Reports
            </CardTitle>
            <CardDescription>Requiring your review</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                {
                  home: "Johnson Family",
                  visitor: "Gabe Groman",
                  date: "2 days ago",
                  status: "pending_review",
                  priority: "high",
                },
                {
                  home: "Smith Residence",
                  visitor: "Gabe Groman",
                  date: "3 days ago",
                  status: "approved",
                  priority: "normal",
                },
                {
                  home: "Davis Home",
                  visitor: "Gabe Groman",
                  date: "1 week ago",
                  status: "needs_followup",
                  priority: "medium",
                },
              ].map((report, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium">{report.home}</div>
                      <div className="text-sm text-muted-foreground">
                        By {report.visitor} • {report.date}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge
                      variant={
                        report.status === "approved"
                          ? "default"
                          : report.status === "pending_review"
                            ? "secondary"
                            : "destructive"
                      }
                    >
                      {report.status.replace("_", " ")}
                    </Badge>
                    <Button size="sm" variant="outline">
                      Review
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Visits */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              Upcoming Visits
            </CardTitle>
            <CardDescription>For your cases</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                {
                  home: "Wilson Family",
                  date: "Tomorrow",
                  time: "10:00 AM",
                  type: "Routine Check",
                  status: "scheduled",
                },
                {
                  home: "Brown Residence",
                  date: "Friday",
                  time: "2:30 PM",
                  type: "Follow-up",
                  status: "confirmed",
                },
                {
                  home: "Taylor Home",
                  date: "Next Monday",
                  time: "9:00 AM",
                  type: "Initial Visit",
                  status: "pending",
                },
              ].map((visit, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium">{visit.home}</div>
                      <div className="text-sm text-muted-foreground">
                        {visit.date} at {visit.time} • {visit.type}
                      </div>
                    </div>
                  </div>
                  <Badge
                    variant={
                      visit.status === "confirmed" ? "default" : visit.status === "scheduled" ? "secondary" : "outline"
                    }
                  >
                    {visit.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Items */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <AlertCircle className="h-5 w-5 mr-2" />
            Action Items
          </CardTitle>
          <CardDescription>Tasks requiring your attention</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              {
                task: "Review safety assessment for Johnson Family",
                due: "Due today",
                priority: "high",
                type: "review",
              },
              {
                task: "Schedule follow-up visit for Smith Residence",
                due: "Due tomorrow",
                priority: "medium",
                type: "schedule",
              },
              {
                task: "Complete case notes for Davis Home",
                due: "Due in 2 days",
                priority: "normal",
                type: "documentation",
              },
              {
                task: "Approve placement recommendation",
                due: "Due this week",
                priority: "high",
                type: "approval",
              },
            ].map((item, index) => (
              <div key={index} className="p-3 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <Badge
                    variant={
                      item.priority === "high" ? "destructive" : item.priority === "medium" ? "secondary" : "outline"
                    }
                  >
                    {item.priority}
                  </Badge>
                  <div className="text-xs text-muted-foreground">{item.due}</div>
                </div>
                <div className="font-medium mb-2">{item.task}</div>
                <Button size="sm" variant="outline">
                  Complete
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
