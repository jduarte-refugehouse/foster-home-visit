"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@clerk/nextjs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { MapPin, Phone, Mail, User, Building, Calendar, BarChart3 } from "lucide-react"
import dynamic from "next/dynamic"

// Dynamically import the map component to avoid SSR issues
const HomesMap = dynamic(() => import("@/components/homes-map"), {
  ssr: false,
  loading: () => <Skeleton className="h-96 w-full" />,
})

interface MapHomeData {
  id: number
  name: string
  address: string
  city: string
  state: string
  zipCode: string
  latitude: number
  longitude: number
  unit: string
  caseManager: string
  lastSync: Date
  phone: string
  email: string
  contactPerson: string
}

interface HomeStats {
  totalHomes: number
  activeHomes: number
  homesWithCoordinates: number
  recentlyUpdated: number
}

interface MapData {
  homes: MapHomeData[]
  stats: HomeStats
}

export default function HomesMapPage() {
  const { isSignedIn, isLoaded } = useAuth()
  const [data, setData] = useState<MapData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedHome, setSelectedHome] = useState<MapHomeData | null>(null)

  const fetchMapData = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/homes-for-map")
      if (!response.ok) {
        throw new Error("Failed to fetch map data")
      }

      const result = await response.json()
      setData(result)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      fetchMapData()
    }
  }, [isLoaded, isSignedIn])

  if (!isLoaded) {
    return (
      <div className="container mx-auto p-6">
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-3">
              <Skeleton className="h-96" />
            </div>
            <div className="space-y-4">
              <Skeleton className="h-32" />
              <Skeleton className="h-48" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!isSignedIn) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold mb-2">Authentication Required</h2>
              <p className="text-gray-600 mb-4">Please sign in to view the homes map.</p>
              <Button asChild>
                <a href="/sign-in">Sign In</a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Homes Map</h1>
          <Badge variant="outline">{data?.homes.length || 0} mapped homes</Badge>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-3">
              <Skeleton className="h-96" />
            </div>
            <div className="space-y-4">
              <Skeleton className="h-32" />
              <Skeleton className="h-48" />
            </div>
          </div>
        ) : error ? (
          <Card>
            <CardContent className="p-6">
              <div className="text-center text-red-600">
                <p>Error: {error}</p>
                <Button onClick={fetchMapData} className="mt-4">
                  Try Again
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Map */}
            <div className="lg:col-span-3">
              <Card>
                <CardContent className="p-0">
                  <HomesMap homes={data?.homes || []} onHomeSelect={setSelectedHome} selectedHome={selectedHome} />
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Statistics */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Statistics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{data?.stats.totalHomes || 0}</div>
                      <div className="text-sm text-gray-600">Total Homes</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{data?.stats.activeHomes || 0}</div>
                      <div className="text-sm text-gray-600">Active</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">{data?.stats.homesWithCoordinates || 0}</div>
                      <div className="text-sm text-gray-600">Mapped</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">{data?.stats.recentlyUpdated || 0}</div>
                      <div className="text-sm text-gray-600">Recent</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Selected Home Details */}
              {selectedHome ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="h-5 w-5" />
                      Selected Home
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h3 className="font-semibold text-lg">{selectedHome.name}</h3>
                      <p className="text-sm text-gray-600">
                        {selectedHome.address}, {selectedHome.city}, {selectedHome.state} {selectedHome.zipCode}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-500" />
                        <span className="text-sm">{selectedHome.contactPerson}</span>
                      </div>
                      {selectedHome.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-gray-500" />
                          <span className="text-sm">{selectedHome.phone}</span>
                        </div>
                      )}
                      {selectedHome.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-gray-500" />
                          <span className="text-sm">{selectedHome.email}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Building className="h-4 w-4 text-gray-500" />
                        <span className="text-sm">{selectedHome.unit}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-500" />
                        <span className="text-sm">{selectedHome.caseManager}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <span className="text-sm">{new Date(selectedHome.lastSync).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t">
                      <div className="text-xs text-gray-500">
                        Coordinates: {selectedHome.latitude.toFixed(6)}, {selectedHome.longitude.toFixed(6)}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="p-6">
                    <div className="text-center text-gray-500">
                      <MapPin className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>Click on a marker to view home details</p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Legend */}
              <Card>
                <CardHeader>
                  <CardTitle>Map Legend</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                    <span className="text-sm">Active Homes</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                    <span className="text-sm">Selected Home</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
