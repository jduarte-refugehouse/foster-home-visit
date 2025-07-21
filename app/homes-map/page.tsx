"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { MapPin, Filter, RotateCcw, Users, Building } from "lucide-react"
import dynamic from "next/dynamic"

// Dynamically import the map component to avoid SSR issues
const HomesMap = dynamic(() => import("@/components/homes-map"), { ssr: false })

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
}

export default function HomesMapPage() {
  const [homes, setHomes] = useState<MapHome[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [unitFilter, setUnitFilter] = useState<string>("ALL")
  const [caseManagerFilter, setCaseManagerFilter] = useState<string>("ALL")
  const [caseManagers, setCaseManagers] = useState<string[]>([])
  const [unitSummary, setUnitSummary] = useState<Record<string, number>>({})

  const fetchHomes = async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams()
      if (unitFilter !== "ALL") params.append("unit", unitFilter)
      if (caseManagerFilter !== "ALL") params.append("caseManager", caseManagerFilter)

      const response = await fetch(`/api/homes-for-map?${params}`)
      const data = await response.json()

      if (data.success) {
        setHomes(data.homes)
        setCaseManagers(data.caseManagers || [])
        setUnitSummary(data.unitSummary || {})
        console.log(`📍 Loaded ${data.homes.length} homes for map`)
      } else {
        setError(data.error || "Failed to fetch homes")
      }
    } catch (err) {
      console.error("Error fetching homes:", err)
      setError("Failed to fetch homes data")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchHomes()
  }, [unitFilter, caseManagerFilter])

  const clearFilters = () => {
    setUnitFilter("ALL")
    setCaseManagerFilter("ALL")
  }

  const hasActiveFilters = unitFilter !== "ALL" || caseManagerFilter !== "ALL"

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading homes map...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2 text-red-600">
              <MapPin className="h-5 w-5" />
              <span className="font-medium">Error loading map</span>
            </div>
            <p className="text-red-600 mt-2">{error}</p>
            <Button onClick={fetchHomes} className="mt-4 bg-transparent" variant="outline">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Homes Map</h1>
          <p className="text-gray-600 mt-1">Interactive map showing {homes.length} foster homes with coordinates</p>
        </div>
        <Button onClick={fetchHomes} variant="outline" size="sm">
          <RotateCcw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="h-5 w-5" />
            <span>Filters</span>
            {hasActiveFilters && (
              <Badge variant="secondary" className="ml-2">
                Active
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-end">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Unit</label>
              <Select value={unitFilter} onValueChange={setUnitFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Select unit" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Units</SelectItem>
                  <SelectItem value="DAL">Dallas (DAL)</SelectItem>
                  <SelectItem value="SAN">San Antonio (SAN)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Case Manager</label>
              <Select value={caseManagerFilter} onValueChange={setCaseManagerFilter}>
                <SelectTrigger className="w-60">
                  <SelectValue placeholder="Select case manager" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Case Managers</SelectItem>
                  {caseManagers.map((manager) => (
                    <SelectItem key={manager} value={manager}>
                      {manager}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {hasActiveFilters && (
              <Button onClick={clearFilters} variant="outline" size="sm">
                Clear Filters
              </Button>
            )}
          </div>

          {/* Filter Summary */}
          {hasActiveFilters && (
            <div className="mt-4 flex flex-wrap gap-2">
              {unitFilter !== "ALL" && (
                <Badge variant="outline">
                  <Building className="h-3 w-3 mr-1" />
                  Unit: {unitFilter}
                </Badge>
              )}
              {caseManagerFilter !== "ALL" && (
                <Badge variant="outline">
                  <Users className="h-3 w-3 mr-1" />
                  Case Manager: {caseManagerFilter}
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <MapPin className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Total Homes</p>
                <p className="text-2xl font-bold">{homes.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Building className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Dallas (DAL)</p>
                <p className="text-2xl font-bold">{unitSummary.DAL || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Building className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-sm text-gray-600">San Antonio (SAN)</p>
                <p className="text-2xl font-bold">{unitSummary.SAN || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Map */}
      <Card>
        <CardContent className="p-0">
          <div className="h-[600px] w-full">
            <HomesMap homes={homes} />
          </div>
        </CardContent>
      </Card>

      {/* Map Legend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Map Legend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-6">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                D
              </div>
              <span className="text-sm">Dallas (DAL) Homes</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-red-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                S
              </div>
              <span className="text-sm">San Antonio (SAN) Homes</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
