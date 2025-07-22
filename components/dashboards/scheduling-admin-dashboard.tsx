import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, Users, MapPin } from "lucide-react"

export default function SchedulingAdminDashboard() {
  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg p-6 text-white">
        <div className="flex items-center gap-3">
          <Calendar className="h-8 w-8" />
          <div>
            <h1 className="text-2xl font-bold">Scheduling Dashboard</h1>
            <p className="text-indigo-100">Manage visits and appointments</p>
          </div>
        </div>
        <p className="mt-4 text-sm italic">"A home is in the heart of every child."</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Visits</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">18</div>
            <p className="text-xs text-muted-foreground">Scheduled visits</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">7</div>
            <p className="text-xs text-muted-foreground">Need scheduling</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Staff</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">Available today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Coverage Areas</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">5</div>
            <p className="text-xs text-muted-foreground">Service regions</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Today's Schedule</CardTitle>
            <CardDescription>Current day visit assignments</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Sarah J. - Johnson Family</p>
                  <p className="text-xs text-muted-foreground">9:00 AM - 10:30 AM, Dallas</p>
                </div>
                <Badge variant="outline" className="text-green-600 border-green-600">
                  Confirmed
                </Badge>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Mike R. - Smith Family</p>
                  <p className="text-xs text-muted-foreground">11:00 AM - 12:00 PM, Plano</p>
                </div>
                <Badge variant="outline" className="text-blue-600 border-blue-600">
                  In Progress
                </Badge>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 bg-yellow-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Lisa M. - Brown Family</p>
                  <p className="text-xs text-muted-foreground">2:00 PM - 3:30 PM, Richardson</p>
                </div>
                <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                  Pending
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Scheduling Requests</CardTitle>
            <CardDescription>New appointments needing assignment</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 bg-red-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Emergency Visit - Wilson Family</p>
                  <p className="text-xs text-muted-foreground">ASAP - High Priority</p>
                </div>
                <Badge variant="destructive">Urgent</Badge>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 bg-orange-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Follow-up - Garcia Family</p>
                  <p className="text-xs text-muted-foreground">This week preferred</p>
                </div>
                <Badge variant="secondary">Standard</Badge>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Initial Visit - Taylor Family</p>
                  <p className="text-xs text-muted-foreground">Next week</p>
                </div>
                <Badge variant="outline">Routine</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
