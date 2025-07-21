"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, MapPin, Phone, Mail, Globe, Building2 } from "lucide-react"
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
  Unit: string
  Latitude: number
  Longitude: number
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

interface ApiResponse {
  success: boolean
  homes: Home[]
  total: number
  unitSummary: Record<string, number>
  filter: string
  debug?: any
}

export default function HomesMapPage() {
  const [homes, setHomes] = useState<Home[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedHome, setSelectedHome] = useState<Home | null>(null)
  const [unitFilter, setUnitFilter] = useState<string>("ALL")
  const [unitSummary, setUnitSummary] = useState<Record<string, number>>({})

  const fetchHomes = async (unit?: string) => {
    setLoading(true)
    try {
      const url = unit && unit !== "ALL" ? `/api/homes-for-map?unit=${unit}` : "/api/homes-for-map"
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data: ApiResponse = await response.json()

      if (data.success) {
        setHomes(data.homes)
        setUnitSummary(data.unitSummary)
        console.log(`📊 Loaded ${data.total} homes for unit: ${data.filter}`)
        console.log(`📈 Unit summary:`, data.unitSummary)
      } else {
        throw new Error(data.error || "Failed to fetch homes")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchHomes(unitFilter === "ALL" ? undefined : unitFilter)
  }, [unitFilter])

  const handleUnitChange = (value: string) => {
    setUnitFilter(value)
    setSelectedHome(null) // Clear selection when changing filter
  }

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
            <Button onClick={() => fetchHomes(unitFilter === "ALL" ? undefined : unitFilter)}>Try Again</Button>
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

          {/* Unit Filter */}
          <div className="flex items-center gap-4">
            <Select value={unitFilter} onValueChange={handleUnitChange}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select Unit" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Units ({Object.values(unitSummary).reduce((a, b) => a + b, 0)})</SelectItem>
                <SelectItem value="DAL">Dallas ({unitSummary.DAL || 0})</SelectItem>
                <SelectItem value="SAN">San Antonio ({unitSummary.SAN || 0})</SelectItem>
              </SelectContent>
            </Select>
            <div className="text-sm text-gray-600">
              {homes.length} homes {unitFilter !== "ALL" && `in ${unitFilter === "DAL" ? "Dallas" : "San Antonio"}`}
            </div>
          </div>
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
                  <CardTitle className="text-lg flex items-center gap-2">
                    {selectedHome.Name}
                    <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      {selectedHome.Unit === "DAL"
                        ? "Dallas"
                        : selectedHome.Unit === "SAN"
                          ? "San Antonio"
                          : selectedHome.Unit}
                    </span>
                  </CardTitle>
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
                    {selectedHome.Capacity && (
                      <div className="flex items-center gap-2 text-sm">
                        <Building2 className="h-4 w-4 text-gray-500" />
                        <span>Capacity: {selectedHome.Capacity}</span>
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

                  <div className="text-xs text-gray-500 pt-2 border-t">
                    <p>
                      Coordinates: {selectedHome.Latitude.toFixed(6)}, {selectedHome.Longitude.toFixed(6)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Home</h3>
                  <p className="text-gray-600">Click on a marker on the map to view home details.</p>
                  {Object.keys(unitSummary).length > 0 && (
                    <div className="mt-4 text-sm text-gray-500">
                      <p>Available units:</p>
                      {Object.entries(unitSummary).map(([unit, count]) => (
                        <p key={unit}>
                          {unit === "DAL" ? "Dallas" : unit === "SAN" ? "San Antonio" : unit}: {count} homes
                        </p>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {homes.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-600 mb-4">
              No homes with coordinates found
              {unitFilter !== "ALL" && ` for ${unitFilter === "DAL" ? "Dallas" : "San Antonio"}`}.
            </div>
            <Button onClick={() => fetchHomes(unitFilter === "ALL" ? undefined : unitFilter)}>Refresh</Button>
          </div>
        )}
      </div>
    </div>
  )
}
