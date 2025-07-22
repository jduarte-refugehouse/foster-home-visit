"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { CheckCircle, AlertTriangle, FileText, TrendingUp, Home } from "lucide-react"

export default function QADirectorDashboard() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Quality Assurance Dashboard</h1>
          <p className="text-muted-foreground">Monitor quality standards and compliance</p>
        </div>
        <Button>
          <FileText className="h-4 w-4 mr-2" />
          Generate QA Report
        </Button>
      </div>

      {/* Quality Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Overall Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">92%</div>
            <Progress value={92} className="mt-2" />
            <div className="text-xs text-muted-foreground mt-1">+3% from last month</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Reviews</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <div className="text-xs text-muted-foreground">3 high priority</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Compliance Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">98%</div>
            <div className="text-xs text-muted-foreground">Above target (95%)</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Issues Resolved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">47</div>
            <div className="text-xs text-muted-foreground">This month</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Reviews */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CheckCircle className="h-5 w-5 mr-2" />
              Recent Reviews
            </CardTitle>
            <CardDescription>Latest quality assessments</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                {
                  home: "Johnson Family Home",
                  reviewer: "Gabe Groman",
                  score: 95,
                  status: "approved",
                  date: "2 hours ago",
                },
                {
                  home: "Smith Residence",
                  reviewer: "Gabe Groman",
                  score: 87,
                  status: "needs_revision",
                  date: "4 hours ago",
                },
                {
                  home: "Davis Home",
                  reviewer: "Heather Sartin",
                  score: 92,
                  status: "pending",
                  date: "1 day ago",
                },
              ].map((review, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Home className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium">{review.home}</div>
                      <div className="text-sm text-muted-foreground">
                        By {review.reviewer} • {review.date}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="text-sm font-medium">{review.score}%</div>
                    <Badge
                      variant={
                        review.status === "approved"
                          ? "default"
                          : review.status === "pending"
                            ? "secondary"
                            : "destructive"
                      }
                    >
                      {review.status.replace("_", " ")}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quality Issues */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2" />
              Quality Issues
            </CardTitle>
            <CardDescription>Items requiring attention</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                {
                  issue: "Incomplete safety checklist",
                  home: "Wilson Family",
                  severity: "high",
                  assigned: "Heather Sartin",
                },
                {
                  issue: "Missing documentation",
                  home: "Brown Residence",
                  severity: "medium",
                  assigned: "Gabe Groman",
                },
                {
                  issue: "Follow-up required",
                  home: "Taylor Home",
                  severity: "low",
                  assigned: "Michele Gorman",
                },
              ].map((issue, index) => (
                <div key={index} className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-medium">{issue.issue}</div>
                    <Badge
                      variant={
                        issue.severity === "high"
                          ? "destructive"
                          : issue.severity === "medium"
                            ? "secondary"
                            : "outline"
                      }
                    >
                      {issue.severity}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground mb-2">
                    {issue.home} • Assigned to {issue.assigned}
                  </div>
                  <Button size="sm" variant="outline">
                    Review
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quality Trends */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="h-5 w-5 mr-2" />
            Quality Trends
          </CardTitle>
          <CardDescription>Performance over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">+5%</div>
              <div className="text-sm text-muted-foreground">Overall improvement</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">-23%</div>
              <div className="text-sm text-muted-foreground">Fewer issues reported</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">98%</div>
              <div className="text-sm text-muted-foreground">Staff satisfaction</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
