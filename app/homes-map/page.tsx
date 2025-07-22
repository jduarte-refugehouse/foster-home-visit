"use client"

import { useUser } from "@clerk/nextjs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, Home, Users, Calendar } from "lucide-react"

// Force dynamic rendering
export const dynamic = "force-dynamic"

export default function HomesMapPage() {
  const { isSignedIn, isLoaded } = useUser()

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!isSignedIn) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
        <p className="text-muted-foreground">Please sign in to access the homes map.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Homes Map</h1>
        <p className="text-muted-foreground">Interactive map view of all foster homes</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <Card className="h-[600px]">
            <CardHeader>
              <CardTitle className="flex items-center">
                <MapPin className="w-5 h-5 mr-2" />
                Interactive Map
              </CardTitle>
              <CardDescription>Click on markers to view detailed information about each home</CardDescription>
            </CardHeader>
            <CardContent className="h-full">
              <div className="w-full h-full bg-muted rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <MapPin className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Interactive map will be loaded here</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Map integration with Google Maps or similar service
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Map Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Home className="w-4 h-4 mr-2 text-blue-500" />
                  <span className="text-sm">Total Homes</span>
                </div>
                <Badge variant="secondary">127</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Users className="w-4 h-4 mr-2 text-green-500" />
                  <span className="text-sm">Active</span>
                </div>
                <Badge variant="default">89</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-2 text-orange-500" />
                  <span className="text-sm">Pending Visits</span>
                </div>
                <Badge variant="outline">23</Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Map Filters</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center space-x-2">
                <input type="checkbox" id="active" className="rounded" defaultChecked />
                <label htmlFor="active" className="text-sm">
                  Active Homes
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <input type="checkbox" id="pending" className="rounded" defaultChecked />
                <label htmlFor="pending" className="text-sm">
                  Pending Visits
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <input type="checkbox" id="compliance" className="rounded" />
                <label htmlFor="compliance" className="text-sm">
                  Compliance Issues
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <input type="checkbox" id="recent" className="rounded" />
                <label htmlFor="recent" className="text-sm">
                  Recent Visits
                </label>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Legend</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm">Active & Compliant</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                <span className="text-sm">Pending Visit</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="text-sm">Compliance Issue</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                <span className="text-sm">Inactive</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
