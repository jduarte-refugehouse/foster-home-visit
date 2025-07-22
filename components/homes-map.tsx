"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MapPin, RefreshCw, AlertCircle } from "lucide-react"

interface MapHome {
  id: string
  name: string
  address: string
  City: string
  State: string
  zipCode: string
  Unit: string
  latitude: number
  longitude: number
  phoneNumber: string
  contactPersonName: string
  email: string
  contactPhone: string
  lastSync: string
}

export default function HomesMap() {
  const [homes, setHomes] = useState<MapHome[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchHomesForMap = async () => {
    try {
      setLoading(true)
      setError(null)
      console.log("🗺️ Fetching homes for map...")

      const response = await fetch("/api/homes-for-map")
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      console.log(`✅ Received ${data.length} homes for map`)
      setHomes(data)
    } catch (err) {
      console.error("❌ Error fetching homes for map:", err)
      setError(err instanceof Error ? err.message : "Failed to fetch homes for map")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchHomesForMap()
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Homes Map</h1>
          <p className="text-muted-foreground">Loading map data...</p>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center h-64">
              <RefreshCw className="h-8 w-8 animate-spin" />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Homes Map</h1>
          <p className="text-muted-foreground">Interactive map of all homes with coordinates</p>
        </div>
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-800 flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Error Loading Map Data
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-700 mb-4">{error}</p>
            <Button onClick={fetchHomesForMap} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Homes Map</h1>
          <p className="text-muted-foreground">Interactive map showing {homes.length} homes with valid coordinates</p>
        </div>
        <Button onClick={fetchHomesForMap} variant="outline" disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {homes.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No Map Data Available</CardTitle>
            <CardDescription>No homes with valid coordinates found for map display.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Homes need valid latitude and longitude coordinates to appear on the map.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Map placeholder - would integrate with actual mapping library */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Interactive Map</CardTitle>
              <CardDescription>Map view of all homes with coordinates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-96 bg-gray-100 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <MapPin className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600">Map integration would go here</p>
                  <p className="text-sm text-gray-500">Showing {homes.length} homes with coordinates</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Homes list sidebar */}
          <Card>
            <CardHeader>
              <CardTitle>Homes on Map</CardTitle>
              <CardDescription>{homes.length} homes with valid coordinates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {homes.map((home) => (
                  <div key={home.id} className="p-3 border rounded-lg hover:bg-gray-50">
                    <div className="font-medium text-sm">{home.name}</div>
                    <div className="text-xs text-gray-600 mb-1">{home.address}</div>
                    <div className="text-xs text-gray-600 mb-2">
                      {home.City}, {home.State} {home.zipCode}
                    </div>
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-xs">
                        {home.Unit || "N/A"}
                      </Badge>
                      <div className="text-xs text-gray-500">
                        {home.latitude.toFixed(4)}, {home.longitude.toFixed(4)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
