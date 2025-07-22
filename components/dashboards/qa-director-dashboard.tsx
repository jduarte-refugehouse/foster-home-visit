import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BarChart3, TrendingUp, AlertTriangle, CheckCircle } from "lucide-react"

export default function QADirectorDashboard() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">QA Director Dashboard</h2>
        <Badge variant="outline">QA Director</Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quality Score</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">94.2%</div>
            <p className="text-xs text-muted-foreground">+2.1% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Compliance Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">98.7%</div>
            <p className="text-xs text-muted-foreground">+0.5% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Issues Identified</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">This week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Improvement</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+15%</div>
            <p className="text-xs text-muted-foreground">Quality metrics</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Quality Metrics Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">Documentation Quality</p>
                  <p className="text-sm text-muted-foreground">Case file completeness</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">96%</p>
                  <Badge variant="outline" className="text-xs">
                    Excellent
                  </Badge>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">Visit Timeliness</p>
                  <p className="text-sm text-muted-foreground">On-time completion rate</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">92%</p>
                  <Badge variant="outline" className="text-xs">
                    Good
                  </Badge>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">Safety Protocols</p>
                  <p className="text-sm text-muted-foreground">Adherence to safety standards</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">99%</p>
                  <Badge variant="outline" className="text-xs">
                    Excellent
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Action Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="p-2 border rounded-lg">
                <p className="text-sm font-medium">Review pending audits</p>
                <p className="text-xs text-muted-foreground">Due: Today</p>
              </div>
              <div className="p-2 border rounded-lg">
                <p className="text-sm font-medium">Update quality standards</p>
                <p className="text-xs text-muted-foreground">Due: This week</p>
              </div>
              <div className="p-2 border rounded-lg">
                <p className="text-sm font-medium">Staff training review</p>
                <p className="text-xs text-muted-foreground">Due: Next week</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
