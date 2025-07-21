"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, MapPin, Phone, Mail, Globe } from "lucide-react"
import Link from "next/link"
import dynamic from "next/dynamic"

const HomesMap = dynamic(() => import("@/components/homes-map"), {
  ssr: false,
  loading: () => (
    <div className="h-96 bg-gray-100 rounded-lg flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
        <p className="text-gray-600">Loading map...</p>
      </div>
    </div>
  ),
})

interface Home {
  Id: number
  Name: string
  Address: string
  City: string
  State: string
  ZipCode: string
  Latitude?: number
  Longitude?: number
  PhoneNumber?: string
  Email?: string
  Website?: string
  Description?: string
  Capacity?: number
  ServicesOffered?: string
  ContactPersonName?: string
  ContactPersonTitle?: string
  IsActive: boolean
  CreatedDate: string
  ModifiedDate: string
}

export default function HomesMapPage() {
  const [homes, setHomes] = useState<Home[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedHome, setSelectedHome] = useState<Home | null>(null)

  useEffect(() => {
    const fetchHomes = async () => {
      try {
        const response = await fetch("/api/homes-for-map")
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        const data = await response.json()
        setHomes(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred")
      } finally {
        setLoading(false)
      }
    }

    fetchHomes()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading homes map...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="text-red-600 mb-4">Error: {error}</div>
            <Button onClick={() => window.location.reload()}>Try Again</Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">Homes Map</h1>
          </div>
          <div className="text-sm text-gray-600">{homes.length} homes with coordinates</div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Map */}
          <div className="lg:col-span-2">
            <Card>
              <CardContent className="p-0">
                <HomesMap homes={homes} onHomeSelect={setSelectedHome} />
              </CardContent>
            </Card>
          </div>

          {/* Home Details */}
          <div className="space-y-4">
            {selectedHome ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{selectedHome.Name}</CardTitle>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin className="h-4 w-4" />
                    {selectedHome.Address}, {selectedHome.City}, {selectedHome.State} {selectedHome.ZipCode}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {selectedHome.Description && <p className="text-sm text-gray-700">{selectedHome.Description}</p>}

                  <div className="space-y-2">
                    {selectedHome.PhoneNumber && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4 text-gray-500" />
                        <span>{selectedHome.PhoneNumber}</span>
                      </div>
                    )}
                    {selectedHome.Email && (
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-4 w-4 text-gray-500" />
                        <span>{selectedHome.Email}</span>
                      </div>
                    )}
                    {selectedHome.Website && (
                      <div className="flex items-center gap-2 text-sm">
                        <Globe className="h-4 w-4 text-gray-500" />
                        <a
                          href={selectedHome.Website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          Visit Website
                        </a>
                      </div>
                    )}
                  </div>

                  {selectedHome.ServicesOffered && (
                    <div>
                      <h4 className="font-medium text-sm mb-2">Services Offered:</h4>
                      <p className="text-sm text-gray-600">{selectedHome.ServicesOffered}</p>
                    </div>
                  )}

                  {selectedHome.ContactPersonName && (
                    <div>
                      <h4 className="font-medium text-sm mb-1">Contact Person:</h4>
                      <p className="text-sm text-gray-600">
                        {selectedHome.ContactPersonName}
                        {selectedHome.ContactPersonTitle && ` - ${selectedHome.ContactPersonTitle}`}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Home</h3>
                  <p className="text-gray-600">Click on a marker on the map to view home details.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {homes.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-600 mb-4">No homes with coordinates found.</div>
            <Button onClick={() => window.location.reload()}>Refresh</Button>
          </div>
        )}
      </div>
    </div>
  )
}
