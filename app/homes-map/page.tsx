"use client"

import { useEffect, useState } from "react"
import { useUser } from "@clerk/nextjs"
import dynamic from "next/dynamic"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MapPin, HomeIcon, Users, Phone, Mail } from "lucide-react"

const HomesMap = dynamic(() => import("@/components/homes-map"), {
  ssr: false,
  loading: () => (
    <div className="h-96 bg-gray-100 rounded-lg flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2 text-gray-600">Loading map...</p>
      </div>
    </div>
  ),
})

interface FosterHome {
  id: number
  name: string
  address: string
  city: string
  state: string
  zip: string
  phone?: string
  email?: string
  latitude?: number
  longitude?: number
  status: string
  capacity: number
  current_residents: number
}

export default function HomesMapPage() {
  const { isLoaded } = useUser()
  const [homes, setHomes] = useState<FosterHome[]>([])
  const [selectedHome, setSelectedHome] = useState<FosterHome | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchHomes()
  }, [])

  const fetchHomes = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch("/api/homes-for-map")
      if (!response.ok) {
        throw new Error("Failed to load homes data")
      }
      const data = await response.json()
      setHomes(data.homes || [])
    } catch (err) {
      console.error("Error fetching homes:", err)
      setError(err instanceof Error ? err.message : "An unknown error occurred")
    } finally {
      setLoading(false)
    }
  }

  if (!isLoaded || loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-8rem)]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading homes map...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Error Loading Data</h1>
        <p className="text-gray-600 mb-4">{error}</p>
        <Button onClick={fetchHomes}>Try Again</Button>
      </div>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return "bg-green-100 text-green-800"
      case "inactive":
        return "bg-red-100 text-red-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Homes Map</h1>
        <p className="text-gray-600">Interactive map view of all foster homes</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MapPin className="mr-2 h-5 w-5" />
                Foster Homes Location Map
              </CardTitle>
              <CardDescription>Click on markers to view home details</CardDescription>
            </CardHeader>
            <CardContent>
              <HomesMap homes={homes} onHomeSelect={setSelectedHome} />
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Home Details</CardTitle>
              <CardDescription>
                {selectedHome ? "Information about selected home" : "Select a home on the map to view details"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedHome ? (
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-lg">{selectedHome.name}</h3>
                    <Badge className={getStatusColor(selectedHome.status)}>{selectedHome.status}</Badge>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-start space-x-2">
                      <MapPin className="h-4 w-4 mt-1 text-gray-500" />
                      <div className="text-sm">
                        <p>{selectedHome.address}</p>
                        <p>
                          {selectedHome.city}, {selectedHome.state} {selectedHome.zip}
                        </p>
                      </div>
                    </div>

                    {selectedHome.phone && (
                      <div className="flex items-center space-x-2">
                        <Phone className="h-4 w-4 text-gray-500" />
                        <span className="text-sm">{selectedHome.phone}</span>
                      </div>
                    )}

                    {selectedHome.email && (
                      <div className="flex items-center space-x-2">
                        <Mail className="h-4 w-4 text-gray-500" />
                        <span className="text-sm">{selectedHome.email}</span>
                      </div>
                    )}

                    <div className="flex items-center space-x-2">
                      <Users className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">
                        {selectedHome.current_residents} / {selectedHome.capacity} residents
                      </span>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <Button className="w-full" size="sm">
                      View Full Details
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <HomeIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Select a home marker on the map to view its details here.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
