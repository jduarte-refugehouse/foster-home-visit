"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MapPin, Calendar, FileText, Clock, CheckCircle, Car } from "lucide-react"
import Link from "next/link"

export function HomeVisitLiaisonDashboard() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold">Field Operations Dashboard</h1>
            <Badge variant="default">
              <Car className="h-3 w-3 mr-1" />
              Home Visit Liaison
            </Badge>
          </div>
          <p className="text-muted-foreground">Gabe Groman - Foster Home Visit Specialist</p>
        </div>
      </div>

      {/* Field Operations Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Visits</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">Scheduled for today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Reports</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">5</div>
            <p className="text-xs text-muted-foreground">Reports to complete</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed This Month</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">28</div>
            <p className="text-xs text-muted-foreground">Visits completed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Miles Traveled</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,247</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
      </div>

      {/* Today's Schedule */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Today's Schedule</CardTitle>
            <CardDescription>Your scheduled home visits for today</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-blue-100">
                  <Clock className="h-3 w-3 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Johnson Family - Initial Visit</p>
                  <p className="text-xs text-muted-foreground">10:00 AM - 123 Oak Street, Dallas</p>
                </div>
                <Button size="sm" variant="outline">
                  Navigate
                </Button>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-blue-100">
                  <Clock className="h-3 w-3 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Smith Family - Follow-up</p>
                  <p className="text-xs text-muted-foreground">2:00 PM - 456 Pine Avenue, Dallas</p>
                </div>
                <Button size="sm" variant="outline">
                  Navigate
                </Button>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-blue-100">
                  <Clock className="h-3 w-3 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Davis Family - Annual Review</p>
                  <p className="text-xs text-muted-foreground">4:30 PM - 789 Elm Drive, Dallas</p>
                </div>
                <Button size="sm" variant="outline">
                  Navigate
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pending Visit Reports</CardTitle>
            <CardDescription>Reports that need to be completed</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-orange-100">
                  <FileText className="h-3 w-3 text-orange-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Wilson Family Visit</p>
                  <p className="text-xs text-muted-foreground">Visited yesterday - Report due today</p>
                </div>
                <Button size="sm" className="bg-orange-600 hover:bg-orange-700">
                  Complete
                </Button>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-orange-100">
                  <FileText className="h-3 w-3 text-orange-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Brown Family Visit</p>
                  <p className="text-xs text-muted-foreground">Visited 2 days ago - Report overdue</p>
                </div>
                <Button size="sm" variant="destructive">
                  Urgent
                </Button>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-green-100">
                  <CheckCircle className="h-3 w-3 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Taylor Family Visit</p>
                  <p className="text-xs text-muted-foreground">Report submitted - Under review</p>
                </div>
                <Badge variant="outline" className="text-green-600 border-green-600">
                  Submitted
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Field Tools */}
      <Card>
        <CardHeader>
          <CardTitle>Field Operations Tools</CardTitle>
          <CardDescription>Tools and resources for conducting home visits</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button asChild variant="outline" className="h-auto p-4 bg-transparent">
              <Link href="/visits/conduct">
                <div className="flex flex-col items-center gap-2">
                  <FileText className="h-6 w-6" />
                  <div className="text-center">
                    <div className="font-medium">Conduct Visit</div>
                    <div className="text-xs text-muted-foreground">Start new visit report</div>
                  </div>
                </div>
              </Link>
            </Button>

            <Button asChild variant="outline" className="h-auto p-4 bg-transparent">
              <Link href="/homes-map">
                <div className="flex flex-col items-center gap-2">
                  <MapPin className="h-6 w-6" />
                  <div className="text-center">
                    <div className="font-medium">Route Planning</div>
                    <div className="text-xs text-muted-foreground">Optimize travel routes</div>
                  </div>
                </div>
              </Link>
            </Button>

            <Button asChild variant="outline" className="h-auto p-4 bg-transparent">
              <Link href="/visits/reports">
                <div className="flex flex-col items-center gap-2">
                  <Calendar className="h-6 w-6" />
                  <div className="text-center">
                    <div className="font-medium">My Reports</div>
                    <div className="text-xs text-muted-foreground">View all visit reports</div>
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
