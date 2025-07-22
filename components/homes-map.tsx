"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, AlertCircle } from "lucide-react"

interface HomeType {
  id: number
  address: string
  city: string
  state: string
  zip_code: string
  latitude?: number
  longitude?: number
  status: string
  created_at: string
  updated_at: string
}

export default function HomesMap() {
  const [homes, setHomes] = useState<HomeType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchHomes = async () => {
      try {
        const response = await fetch("/api/homes-for-map")
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }
        const data = await response.json()
        setHomes(data)
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error"
        setError(errorMessage)
        console.error("Error fetching homes for map:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchHomes()
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Homes Map</h1>
          <p className="text-muted-foreground">Loading homes with location data...</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-3 bg-muted rounded w-full mb-2"></div>
                <div className="h-3 bg-muted rounded w-2/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Homes Map</h1>
          <p className="text-muted-foreground">Interactive map of all homes with location data</p>
        </div>
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-800 flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Error Loading Homes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-700">{error}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Homes Map</h1>
        <p className="text-muted-foreground">Interactive map of all homes with location data ({homes.length} homes)</p>
      </div>

      {/* Map Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Interactive Map
          </CardTitle>
          <CardDescription>Map visualization will be implemented here</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-96 bg-muted rounded-lg flex items-center justify-center">
            <div className="text-center">
              <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Map component will be integrated here</p>
              <p className="text-sm text-muted-foreground mt-2">Showing {homes.length} homes with coordinates</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Homes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {homes.map((home) => (
          <Card key={home.id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  {/* Home Icon Placeholder */}
                  Home #{home.id}
                </span>
                <Badge variant={home.status === "active" ? "default" : "secondary"}>{home.status}</Badge>
              </CardTitle>
              <CardDescription>{home.address}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm">
                  {home.city}, {home.state} {home.zip_code}
                </p>
                {home.latitude && home.longitude && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {home.latitude.toFixed(6)}, {home.longitude.toFixed(6)}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">Added: {new Date(home.created_at).toLocaleDateString()}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {homes.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Homes with Location Data</h3>
            <p className="text-muted-foreground">No homes have been found with latitude and longitude coordinates.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
