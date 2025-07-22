"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MapPin, Phone, Mail, Building, RefreshCw } from "lucide-react"

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

interface HomesMapProps {
  filters?: {
    unit?: string
    caseManager?: string
  }
}

export default function HomesMap({ filters }: HomesMapProps) {
  const [homes, setHomes] = useState<MapHome[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchHomes = async () => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      if (filters?.unit && filters.unit !== "ALL") {
        params.append("unit", filters.unit)
      }
      if (filters?.caseManager && filters.caseManager !== "ALL") {
        params.append("caseManager", filters.caseManager)
      }

      const response = await fetch(`/api/homes-for-map?${params.toString()}`)

      if (!response.ok) {
        throw new Error(`Failed to fetch homes: ${response.statusText}`)
      }

      const data = await response.json()
      setHomes(data.homes || [])
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error"
      setError(errorMessage)
      console.error("Error fetching homes for map:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchHomes()
  }, [filters])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 animate-spin" />
            Loading Map Data...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Loading homes data...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-red-600">Map Error</CardTitle>
          <CardDescription>Failed to load homes data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={fetchHomes} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Homes Map
          </CardTitle>
          <CardDescription>Showing {homes.length} homes with valid coordinates</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Map placeholder - would integrate with actual mapping library */}
          <div className="bg-muted rounded-lg h-96 flex items-center justify-center mb-6">
            <div className="text-center">
              <MapPin className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg font-medium">Interactive Map</p>
              <p className="text-muted-foreground">Map integration would display {homes.length} homes here</p>
            </div>
          </div>

          {/* Homes List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {homes.map((home) => (
              <Card key={home.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">{home.name}</CardTitle>
                  <CardDescription className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {home.latitude.toFixed(4)}, {home.longitude.toFixed(4)}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm font-medium">{home.address}</p>
                    <p className="text-sm text-muted-foreground">
                      {home.City}, {home.State} {home.zipCode}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4 text-muted-foreground" />
                    <Badge variant="secondary">{home.Unit}</Badge>
                  </div>

                  {home.contactPersonName && home.contactPersonName !== "~unassigned~" && (
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Case Manager</p>
                      <p className="text-sm text-muted-foreground">{home.contactPersonName}</p>

                      {home.contactPhone && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Phone className="h-3 w-3" />
                          {home.contactPhone}
                        </div>
                      )}

                      {home.email && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Mail className="h-3 w-3" />
                          {home.email}
                        </div>
                      )}
                    </div>
                  )}

                  {home.phoneNumber && (
                    <div className="flex items-center gap-1 text-sm">
                      <Phone className="h-3 w-3 text-muted-foreground" />
                      <span className="text-muted-foreground">Home:</span>
                      {home.phoneNumber}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {homes.length === 0 && (
            <div className="text-center py-8">
              <MapPin className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg font-medium">No homes found</p>
              <p className="text-muted-foreground">No homes with valid coordinates match the current filters</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
