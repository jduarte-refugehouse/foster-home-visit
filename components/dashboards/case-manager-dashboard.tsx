import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FileText, Users, Calendar, AlertCircle } from "lucide-react"

export default function CaseManagerDashboard() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Case Manager Dashboard</h2>
        <Badge variant="outline">Case Manager</Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Cases</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">28</div>
            <p className="text-xs text-muted-foreground">Currently assigned</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Families Served</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">52</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Reviews</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">6</div>
            <p className="text-xs text-muted-foreground">This week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Priority Cases</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4</div>
            <p className="text-xs text-muted-foreground">Require attention</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Case Priority Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 border rounded-lg border-red-200 bg-red-50">
                <div>
                  <p className="font-medium text-red-800">Johnson Family - Case #2024-001</p>
                  <p className="text-sm text-red-600">Safety assessment overdue</p>
                </div>
                <Badge variant="destructive">High Priority</Badge>
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg border-yellow-200 bg-yellow-50">
                <div>
                  <p className="font-medium text-yellow-800">Smith Family - Case #2024-015</p>
                  <p className="text-sm text-yellow-600">Court hearing next week</p>
                </div>
                <Badge variant="outline" className="border-yellow-500 text-yellow-700">
                  Medium Priority
                </Badge>
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">Davis Family - Case #2024-023</p>
                  <p className="text-sm text-muted-foreground">Regular check-in scheduled</p>
                </div>
                <Badge variant="secondary">Normal</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Today's Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="p-2 border rounded-lg">
                <p className="text-sm font-medium">Complete safety assessment</p>
                <p className="text-xs text-muted-foreground">Johnson Family</p>
              </div>
              <div className="p-2 border rounded-lg">
                <p className="text-sm font-medium">Update case notes</p>
                <p className="text-xs text-muted-foreground">3 cases pending</p>
              </div>
              <div className="p-2 border rounded-lg">
                <p className="text-sm font-medium">Schedule home visit</p>
                <p className="text-xs text-muted-foreground">Williams Family</p>
              </div>
              <div className="p-2 border rounded-lg">
                <p className="text-sm font-medium">Prepare court documents</p>
                <p className="text-xs text-muted-foreground">Smith Family hearing</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
