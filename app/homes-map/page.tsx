"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, List, MapPin, Phone, Mail, Users, AlertCircle, Loader2 } from "lucide-react"
import Link from "next/link"
import { useSafeUser } from "@/hooks/use-safe-user"
import HomesMap from "@/components/homes-map"

interface Home {
  id: number
  name: string
  address: string
  city: string
  state: string
  zip: string
  phone: string
  email: string
  capacity: number
  current_residents: number
  license_number: string
  license_expiry: string
  status: "active" | "inactive" | "pending"
  latitude: number
  longitude: number
}

export default function HomesMapPage() {
  const { user, isLoaded } = useSafeUser()
  const [homes, setHomes] = useState<Home[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedHome, setSelectedHome] = useState<Home | null>(null)

  useEffect(() => {
    if (isLoaded) {
      fetchHomes()
    }
  }, [isLoaded])

  const fetchHomes = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch("/api/homes-for-map")
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      if (data.success) {
        // Filter out homes without valid coordinates
        const validHomes = (data.homes || []).filter(
          (home: Home) => home.latitude && home.longitude && !isNaN(home.latitude) && !isNaN(home.longitude),
        )
        setHomes(validHomes)
      } else {
        throw new Error(data.error || "Failed to fetch homes")
      }
    } catch (err) {
      console.error("Error fetching homes:", err)
      setError(err instanceof Error ? err.message : "An unknown error occurred")
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
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

  const getCapacityStatus = (current: number, capacity: number) => {
    const percentage = (current / capacity) * 100
    if (percentage >= 90) return "text-red-600"
    if (percentage >= 75) return "text-yellow-600"
    return "text-green-600"
  }

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Loading...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <div className="flex items-center space-x-2">
                <MapPin className="w-6 h-6 text-blue-600" />
                <h1 className="text-xl font-semibold text-gray-900">Foster Homes Map</h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/homes-list">
                <Button variant="outline" size="sm">
                  <List className="w-4 h-4 mr-2" />
                  List View
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error State */}
        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              {error}
              <Button variant="outline" size="sm" onClick={fetchHomes} className="ml-4 bg-transparent">
                Try Again
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center h-96">
            <div className="flex items-center space-x-2">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span>Loading map data...</span>
            </div>
          </div>
        )}

        {/* Map and Details */}
        {!loading && !error && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Map */}
            <div className="lg:col-span-2">
              <Card className="h-[600px]">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between">
                    <span>Foster Homes Locations</span>
                    <Badge variant="secondary">{homes.length} homes</Badge>
                  </CardTitle>
                  <CardDescription>Click on a marker to view home details</CardDescription>
                </CardHeader>
                <CardContent className="h-[500px] p-0">
                  <HomesMap homes={homes} onHomeSelect={setSelectedHome} selectedHome={selectedHome} />
                </CardContent>
              </Card>
            </div>

            {/* Home Details */}
            <div className="lg:col-span-1">
              <Card className="h-[600px]">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Users className="w-5 h-5" />
                    <span>Home Details</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedHome ? (
                    <div className="space-y-4">
                      <div>
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-semibold text-lg">{selectedHome.name}</h3>
                          <Badge className={getStatusColor(selectedHome.status)}>{selectedHome.status}</Badge>
                        </div>
                        <p className="text-sm text-gray-600 flex items-center">
                          <MapPin className="w-4 h-4 mr-1" />
                          {selectedHome.address}, {selectedHome.city}, {selectedHome.state} {selectedHome.zip}
                        </p>
                      </div>

                      <div className="space-y-3 pt-4 border-t">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Capacity</span>
                          <span
                            className={`font-medium ${getCapacityStatus(selectedHome.current_residents, selectedHome.capacity)}`}
                          >
                            {selectedHome.current_residents}/{selectedHome.capacity}
                          </span>
                        </div>

                        <div className="flex items-center text-sm">
                          <Phone className="w-4 h-4 mr-2 text-gray-400" />
                          <span>{selectedHome.phone}</span>
                        </div>

                        <div className="flex items-center text-sm">
                          <Mail className="w-4 h-4 mr-2 text-gray-400" />
                          <span className="break-all">{selectedHome.email}</span>
                        </div>

                        <div className="pt-3 border-t">
                          <p className="text-xs text-gray-500 mb-1">License: {selectedHome.license_number}</p>
                          <p className="text-xs text-gray-500">
                            Expires: {new Date(selectedHome.license_expiry).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                      <MapPin className="w-12 h-12 text-gray-300 mb-4" />
                      <h3 className="font-medium text-gray-900 mb-2">Select a Home</h3>
                      <p className="text-sm text-gray-600">
                        Click on a marker on the map to view detailed information about that foster home.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && homes.length === 0 && (
          <div className="text-center py-12">
            <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No locations found</h3>
            <p className="text-gray-600">
              No foster homes with valid coordinates are currently available to display on the map.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
