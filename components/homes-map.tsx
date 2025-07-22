"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, Phone, Mail, Globe, Users, AlertCircle } from "lucide-react"

interface Home {
  id: number
  name: string
  address: string
  latitude?: number
  longitude?: number
  phone?: string
  email?: string
  website?: string
  capacity?: number
  current_residents?: number
  status: string
  created_at: Date
  updated_at: Date
}

export default function HomesMap() {
  const [homes, setHomes] = useState<Home[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchHomes = async () => {
      try {
        setLoading(true)
        const response = await fetch("/api/homes-for-map")

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        const data = await response.json()
        setHomes(data)
      } catch (err) {
        console.error("Error fetching homes for map:", err)
        setError(err instanceof Error ? err.message : "Failed to load homes")
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
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
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
        <p className="text-muted-foreground">
          Interactive map of all homes with location data ({homes.length} homes found)
        </p>
      </div>

      {homes.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No Homes Found</CardTitle>
            <CardDescription>No homes with location data are currently available.</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {homes.map((home) => (
            <Card key={home.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{home.name}</CardTitle>
                    <CardDescription className="flex items-center gap-1 mt-1">
                      <MapPin className="h-3 w-3" />
                      {home.address}
                    </CardDescription>
                  </div>
                  <Badge variant={home.status === "active" ? "default" : "secondary"}>{home.status}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* Coordinates */}
                  <div className="text-sm text-muted-foreground">
                    <strong>Coordinates:</strong> {home.latitude?.toFixed(6)}, {home.longitude?.toFixed(6)}
                  </div>

                  {/* Capacity Info */}
                  {(home.capacity || home.current_residents) && (
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {home.current_residents || 0} / {home.capacity || 0} residents
                      </span>
                      {home.capacity && (
                        <Badge variant="outline" className="text-xs">
                          {Math.round(((home.current_residents || 0) / home.capacity) * 100)}% occupied
                        </Badge>
                      )}
                    </div>
                  )}

                  {/* Contact Info */}
                  <div className="space-y-1">
                    {home.phone && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Phone className="h-3 w-3" />
                        <span>{home.phone}</span>
                      </div>
                    )}
                    {home.email && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Mail className="h-3 w-3" />
                        <span>{home.email}</span>
                      </div>
                    )}
                    {home.website && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Globe className="h-3 w-3" />
                        <a
                          href={home.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          Visit Website
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
