"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { RefreshCw, Search, MapPin, List, X } from "lucide-react"
import dynamic from "next/dynamic"

// Dynamically import the map component to prevent SSR issues
const HomesMap = dynamic(() => import("@/components/homes-map"), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-full">Loading map...</div>,
})

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

interface ApiResponse {
  success: boolean
  homes: MapHome[]
  caseManagers: string[]
  summary: {
    total: number
    byUnit: Record<string, number>
  }
}

export default function HomesMapPage() {
  const [homes, setHomes] = useState<MapHome[]>([])
  const [filteredHomes, setFilteredHomes] = useState<MapHome[]>([])
  const [caseManagers, setCaseManagers] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedHome, setSelectedHome] = useState<MapHome | null>(null)

  // Filter states
  const [unitFilter, setUnitFilter] = useState<string>("ALL")
  const [caseManagerFilter, setCaseManagerFilter] = useState<string>("ALL")
  const [searchQuery, setSearchQuery] = useState("")

  const fetchHomes = async () => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      if (unitFilter !== "ALL") params.append("unit", unitFilter)
      if (caseManagerFilter !== "ALL") params.append("caseManager", caseManagerFilter)

      const response = await fetch(`/api/homes-for-map?${params}`)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data: ApiResponse = await response.json()
      if (data.success) {
        setHomes(data.homes)
        setCaseManagers(data.caseManagers || [])
        console.log(`📊 Loaded ${data.homes.length} homes for map`)
      } else {
        throw new Error(data.error || "Failed to fetch homes")
      }
    } catch (err) {
      console.error("❌ Error fetching homes:", err)
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setLoading(false)
    }
  }

  // Apply search filter to homes
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredHomes(homes)
    } else {
      const query = searchQuery.toLowerCase()
      const filtered = homes.filter(
        (home) =>
          home.name.toLowerCase().includes(query) ||
          home.address.toLowerCase().includes(query) ||
          home.City.toLowerCase().includes(query) ||
          home.contactPersonName.toLowerCase().includes(query),
      )
      setFilteredHomes(filtered)
    }
  }, [homes, searchQuery])

  // Fetch homes when filters change
  useEffect(() => {
    fetchHomes()
  }, [unitFilter, caseManagerFilter])

  const clearFilters = () => {
    setUnitFilter("ALL")
    setCaseManagerFilter("ALL")
    setSearchQuery("")
    setSelectedHome(null)
  }

  const handleHomeSelect = (home: MapHome) => {
    setSelectedHome(home)
    console.log(`🎯 Home selected: ${home.name}`)
  }

  const activeFiltersCount = [unitFilter !== "ALL", caseManagerFilter !== "ALL", searchQuery.trim() !== ""].filter(
    Boolean,
  ).length

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-96">
          <div className="flex items-center gap-2">
            <RefreshCw className="h-6 w-6 animate-spin" />
            <span>Loading homes map...</span>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-red-600">
              <p className="font-semibold">Error loading homes map</p>
              <p className="text-sm mt-2">{error}</p>
              <Button onClick={fetchHomes} className="mt-4">
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            </div>
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
          <h1 className="text-3xl font-bold">Homes Map</h1>
          <p className="text-muted-foreground">
            Interactive map showing {filteredHomes.length} of {homes.length} homes
          </p>
        </div>
        <Button onClick={fetchHomes} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Filters
            {activeFiltersCount > 0 && <Badge variant="secondary">{activeFiltersCount} active</Badge>}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search homes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Unit Filter */}
            <Select value={unitFilter} onValueChange={setUnitFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Select unit" />
              </SelectTrigger>
              <SelectContent className="z-50">
                <SelectItem value="ALL">All Units</SelectItem>
                <SelectItem value="DAL">Dallas</SelectItem>
                <SelectItem value="SAN">San Antonio</SelectItem>
              </SelectContent>
            </Select>

            {/* Case Manager Filter */}
            <Select value={caseManagerFilter} onValueChange={setCaseManagerFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Select case manager" />
              </SelectTrigger>
              <SelectContent className="z-50 max-h-60 overflow-y-auto">
                <SelectItem value="ALL">All Case Managers</SelectItem>
                {caseManagers.map((manager) => (
                  <SelectItem key={manager} value={manager}>
                    {manager}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Clear Filters */}
            {activeFiltersCount > 0 && (
              <Button variant="outline" onClick={clearFilters}>
                <X className="h-4 w-4 mr-2" />
                Clear Filters
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Map and List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
        {/* Map - Takes 2/3 of the space */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Interactive Map
            </CardTitle>
          </CardHeader>
          <CardContent className="p-2 h-[520px]">
            <HomesMap homes={filteredHomes} onHomeSelect={handleHomeSelect} selectedHome={selectedHome} />
          </CardContent>
        </Card>

        {/* Homes List - Takes 1/3 of the space */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <List className="h-5 w-5" />
              Homes List ({filteredHomes.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-2">
            <div className="space-y-2 h-[520px] overflow-y-auto">
              {filteredHomes.map((home) => (
                <div
                  key={home.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-all hover:shadow-md ${
                    selectedHome?.id === home.id
                      ? "border-blue-500 bg-blue-50 shadow-md"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                  onClick={() => handleHomeSelect(home)}
                >
                  <div className="space-y-1">
                    <div className="font-semibold text-sm">{home.name}</div>
                    <div className="text-xs text-muted-foreground">{home.address}</div>
                    <div className="text-xs text-muted-foreground">
                      {home.City}, {home.State} {home.zipCode}
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant={home.Unit === "DAL" ? "default" : "destructive"} className="text-xs">
                        {home.Unit === "DAL" ? "Dallas" : "San Antonio"}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}

              {filteredHomes.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No homes found matching your filters</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
