"use client"

import { useUser } from "@clerk/nextjs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { MapPin, Search, Navigation } from "lucide-react"

// Force dynamic rendering
export const dynamic = "force-dynamic"

export default function CoordinateTestPage() {
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
        <p className="text-muted-foreground">Please sign in to access coordinate testing.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Coordinate Testing</h1>
        <p className="text-muted-foreground">Test and validate geographic coordinates for homes</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Search className="w-5 h-5 mr-2" />
              Address Lookup
            </CardTitle>
            <CardDescription>Enter an address to get its coordinates</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="address">Street Address</Label>
              <Input id="address" placeholder="123 Main Street" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input id="city" placeholder="Springfield" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Input id="state" placeholder="IL" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="zip">ZIP Code</Label>
              <Input id="zip" placeholder="62701" />
            </div>
            <Button className="w-full">
              <MapPin className="w-4 h-4 mr-2" />
              Get Coordinates
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Navigation className="w-5 h-5 mr-2" />
              Coordinate Results
            </CardTitle>
            <CardDescription>Geographic coordinates and validation results</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="latitude">Latitude</Label>
                <Input id="latitude" placeholder="39.7817" readOnly />
              </div>
              <div className="space-y-2">
                <Label htmlFor="longitude">Longitude</Label>
                <Input id="longitude" placeholder="-89.6501" readOnly />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="formatted">Formatted Address</Label>
              <Input id="formatted" placeholder="123 Main St, Springfield, IL 62701, USA" readOnly />
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <h3 className="font-medium mb-2">Validation Status</h3>
              <p className="text-sm text-muted-foreground">
                Click "Get Coordinates" to validate an address and retrieve its geographic coordinates.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Coordinate Tests</CardTitle>
          <CardDescription>History of recent address lookups and validations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              {
                address: "456 Oak Avenue, Springfield, IL 62702",
                latitude: "39.7901",
                longitude: "-89.6440",
                status: "Valid",
                timestamp: "2024-01-15 14:30",
              },
              {
                address: "789 Pine Street, Springfield, IL 62703",
                latitude: "39.7756",
                longitude: "-89.6389",
                status: "Valid",
                timestamp: "2024-01-15 14:25",
              },
              {
                address: "321 Elm Drive, Springfield, IL 62704",
                latitude: "39.7689",
                longitude: "-89.6501",
                status: "Valid",
                timestamp: "2024-01-15 14:20",
              },
            ].map((test, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <h3 className="font-medium">{test.address}</h3>
                  <p className="text-sm text-muted-foreground">
                    {test.latitude}, {test.longitude} • {test.timestamp}
                  </p>
                </div>
                <div className="text-right">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    {test.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
