import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Home, MapPin, Clock, CheckCircle } from "lucide-react"

export default function HomeVisitLiaisonDashboard() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Home Visit Liaison Dashboard</h2>
        <Badge variant="outline">Home Visit Liaison</Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Scheduled Visits</CardTitle>
            <Home className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">18</div>
            <p className="text-xs text-muted-foreground">This week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Visits</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">This week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Travel Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4.2h</div>
            <p className="text-xs text-muted-foreground">Average daily</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Coverage Area</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">North</div>
            <p className="text-xs text-muted-foreground">Dallas region</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Today's Route</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">9:00 AM - Johnson Family</p>
                  <p className="text-sm text-muted-foreground">1234 Oak Street, Dallas, TX</p>
                </div>
                <Badge variant="outline">Next</Badge>
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">11:30 AM - Williams Family</p>
                  <p className="text-sm text-muted-foreground">5678 Pine Avenue, Dallas, TX</p>
                </div>
                <Badge variant="secondary">Scheduled</Badge>
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">2:00 PM - Davis Family</p>
                  <p className="text-sm text-muted-foreground">9012 Elm Drive, Dallas, TX</p>
                </div>
                <Badge variant="secondary">Scheduled</Badge>
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">4:30 PM - Brown Family</p>
                  <p className="text-sm text-muted-foreground">3456 Maple Lane, Dallas, TX</p>
                </div>
                <Badge variant="secondary">Scheduled</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Visit Checklist</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <input type="checkbox" className="rounded" />
                <span className="text-sm">Safety assessment form</span>
              </div>
              <div className="flex items-center space-x-2">
                <input type="checkbox" className="rounded" />
                <span className="text-sm">Documentation camera</span>
              </div>
              <div className="flex items-center space-x-2">
                <input type="checkbox" className="rounded" />
                <span className="text-sm">Emergency contact list</span>
              </div>
              <div className="flex items-center space-x-2">
                <input type="checkbox" className="rounded" />
                <span className="text-sm">Resource materials</span>
              </div>
              <div className="flex items-center space-x-2">
                <input type="checkbox" className="rounded" />
                <span className="text-sm">Vehicle inspection</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
