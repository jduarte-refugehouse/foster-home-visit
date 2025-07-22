"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, Clock, Users, Home, Plus, Edit } from "lucide-react"
import Link from "next/link"

export function SchedulingAdminDashboard() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold">Scheduling Dashboard</h1>
            <Badge variant="default">
              <Calendar className="h-3 w-3 mr-1" />
              Scheduling Administrator
            </Badge>
          </div>
          <p className="text-muted-foreground">Michele Gorman - Home Visit Scheduling Management</p>
        </div>
      </div>

      {/* Scheduling Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Week's Visits</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">18</div>
            <p className="text-xs text-muted-foreground">+3 from last week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Scheduling</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">7</div>
            <p className="text-xs text-muted-foreground">Needs scheduling</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Liaisons</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4</div>
            <p className="text-xs text-muted-foreground">Available for visits</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Homes Scheduled</CardTitle>
            <Home className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">156</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
      </div>

      {/* Scheduling Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Schedule Management</CardTitle>
            <CardDescription>Create and manage home visit schedules</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button className="w-full justify-start">
              <Plus className="mr-2 h-4 w-4" />
              Create New Visit Schedule
            </Button>
            <Button variant="outline" className="w-full justify-start bg-transparent">
              <Edit className="mr-2 h-4 w-4" />
              Edit Existing Schedules
            </Button>
            <Button variant="outline" className="w-full justify-start bg-transparent">
              <Calendar className="mr-2 h-4 w-4" />
              View Calendar Overview
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upcoming Schedules</CardTitle>
            <CardDescription>Recently scheduled visits requiring attention</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-blue-100">
                  <Calendar className="h-3 w-3 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Johnson Family - Initial Visit</p>
                  <p className="text-xs text-muted-foreground">Tomorrow 2:00 PM - Gabe Groman</p>
                </div>
                <Button size="sm" variant="outline">
                  <Edit className="h-3 w-3" />
                </Button>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-green-100">
                  <Calendar className="h-3 w-3 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Smith Family - Follow-up</p>
                  <p className="text-xs text-muted-foreground">Friday 10:00 AM - Gabe Groman</p>
                </div>
                <Button size="sm" variant="outline">
                  <Edit className="h-3 w-3" />
                </Button>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-orange-100">
                  <Clock className="h-3 w-3 text-orange-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Davis Family - Needs Scheduling</p>
                  <p className="text-xs text-muted-foreground text-orange-600">Overdue for visit</p>
                </div>
                <Button size="sm" variant="outline">
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Access */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Access</CardTitle>
          <CardDescription>Frequently used scheduling tools</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button asChild variant="outline" className="h-auto p-4 bg-transparent">
              <Link href="/homes-list">
                <div className="flex flex-col items-center gap-2">
                  <Home className="h-6 w-6" />
                  <div className="text-center">
                    <div className="font-medium">View All Homes</div>
                    <div className="text-xs text-muted-foreground">Browse homes for scheduling</div>
                  </div>
                </div>
              </Link>
            </Button>

            <Button asChild variant="outline" className="h-auto p-4 bg-transparent">
              <Link href="/homes-map">
                <div className="flex flex-col items-center gap-2">
                  <Calendar className="h-6 w-6" />
                  <div className="text-center">
                    <div className="font-medium">Geographic Planning</div>
                    <div className="text-xs text-muted-foreground">Plan routes efficiently</div>
                  </div>
                </div>
              </Link>
            </Button>

            <Button asChild variant="outline" className="h-auto p-4 bg-transparent">
              <Link href="/visits">
                <div className="flex flex-col items-center gap-2">
                  <Users className="h-6 w-6" />
                  <div className="text-center">
                    <div className="font-medium">Liaison Availability</div>
                    <div className="text-xs text-muted-foreground">Check staff schedules</div>
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
