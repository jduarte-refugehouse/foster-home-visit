"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { FileText, Users, Calendar, CheckCircle, Clock, AlertTriangle } from "lucide-react"
import Link from "next/link"

export function CaseManagerDashboard() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold">Case Management Dashboard</h1>
            <Badge variant="default">
              <FileText className="h-3 w-3 mr-1" />
              Case Manager
            </Badge>
          </div>
          <p className="text-muted-foreground">Heather Sartin - Foster Home Case Management</p>
        </div>
      </div>

      {/* Case Management Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Active Cases</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24</div>
            <p className="text-xs text-muted-foreground">Assigned to me</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Reviews</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">8</div>
            <p className="text-xs text-muted-foreground">Visit reports to review</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved This Month</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">32</div>
            <p className="text-xs text-muted-foreground">Visit reports approved</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Visits</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">6</div>
            <p className="text-xs text-muted-foreground">Next 7 days</p>
          </CardContent>
        </Card>
      </div>

      {/* Case Management Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Visit Reports</CardTitle>
            <CardDescription>Visit reports requiring your review and approval</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-orange-100">
                  <Clock className="h-3 w-3 text-orange-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Johnson Family - Initial Visit</p>
                  <p className="text-xs text-muted-foreground">Conducted by Gabe Groman - 2 days ago</p>
                </div>
                <Button size="sm" variant="outline">
                  Review
                </Button>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-orange-100">
                  <Clock className="h-3 w-3 text-orange-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Smith Family - Follow-up Visit</p>
                  <p className="text-xs text-muted-foreground">Conducted by Gabe Groman - 1 day ago</p>
                </div>
                <Button size="sm" variant="outline">
                  Review
                </Button>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-green-100">
                  <CheckCircle className="h-3 w-3 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Davis Family - Annual Review</p>
                  <p className="text-xs text-muted-foreground">Approved by Heather Sartin - 3 days ago</p>
                </div>
                <Badge variant="outline" className="text-green-600 border-green-600">
                  Approved
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>My Caseload</CardTitle>
            <CardDescription>Foster families under your case management</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-blue-100">
                  <Users className="h-3 w-3 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Johnson Family</p>
                  <p className="text-xs text-muted-foreground">Next visit: Tomorrow 2:00 PM</p>
                </div>
                <Badge variant="outline">Active</Badge>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-blue-100">
                  <Users className="h-3 w-3 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Smith Family</p>
                  <p className="text-xs text-muted-foreground">Last visit: 2 weeks ago</p>
                </div>
                <Badge variant="outline">Active</Badge>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-orange-100">
                  <AlertTriangle className="h-3 w-3 text-orange-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Davis Family</p>
                  <p className="text-xs text-muted-foreground text-orange-600">Visit overdue</p>
                </div>
                <Badge variant="outline" className="text-orange-600 border-orange-600">
                  Attention
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Case Management Tools</CardTitle>
          <CardDescription>Common case management tasks and resources</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button asChild variant="outline" className="h-auto p-4 bg-transparent">
              <Link href="/cases">
                <div className="flex flex-col items-center gap-2">
                  <FileText className="h-6 w-6" />
                  <div className="text-center">
                    <div className="font-medium">My Cases</div>
                    <div className="text-xs text-muted-foreground">View assigned cases</div>
                  </div>
                </div>
              </Link>
            </Button>

            <Button asChild variant="outline" className="h-auto p-4 bg-transparent">
              <Link href="/visits">
                <div className="flex flex-col items-center gap-2">
                  <Calendar className="h-6 w-6" />
                  <div className="text-center">
                    <div className="font-medium">Visit Reports</div>
                    <div className="text-xs text-muted-foreground">Review and approve</div>
                  </div>
                </div>
              </Link>
            </Button>

            <Button asChild variant="outline" className="h-auto p-4 bg-transparent">
              <Link href="/homes-list">
                <div className="flex flex-col items-center gap-2">
                  <Users className="h-6 w-6" />
                  <div className="text-center">
                    <div className="font-medium">Foster Homes</div>
                    <div className="text-xs text-muted-foreground">View home details</div>
                  </div>
                </div>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
