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
  loading: () => (
    <div className="flex items-center justify-center h-96">
      <div className="flex items-center gap-2">
        <RefreshCw className="h-6 w-6 animate-spin text-refuge-purple" />
        <span className="text-refuge-dark-blue">Loading homes map...</span>
      </div>
    </div>
  ),
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
  lastSync: string
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

      console.log("🏠 Fetching homes data...")
      const response = await fetch(`/api/homes-for-map?${params}`)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data: ApiResponse = await response.json()
      console.log("✅ Homes data received:", data)

      if (data.success) {
        // Filter out homes without valid coordinates
        const validHomes = data.homes.filter(
          (home) =>
            home.latitude &&
            home.longitude &&
            !isNaN(home.latitude) &&
            !isNaN(home.longitude) &&
            home.latitude !== 0 &&
            home.longitude !== 0,
        )

        setHomes(validHomes)
        setCaseManagers(data.caseManagers || [])
        console.log(`📊 Loaded ${validHomes.length} homes with valid coordinates for map`)
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
      <div className="flex items-center justify-center h-96">
        <div className="flex items-center gap-2">
          <RefreshCw className="h-6 w-6 animate-spin text-refuge-purple" />
          <span className="text-refuge-dark-blue">Loading homes map...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-gradient-to-br from-red-50 to-red-100/50">
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            <p className="font-semibold">Error loading homes map</p>
            <p className="text-sm mt-2">{error}</p>
            <Button
              onClick={fetchHomes}
              className="mt-4 bg-gradient-to-r from-refuge-purple to-refuge-magenta hover:from-refuge-purple/90 hover:to-refuge-magenta/90 text-white transition-all duration-200"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card className="border-refuge-light-purple/30 bg-gradient-to-br from-refuge-gray/30 to-white backdrop-blur-sm">
        <CardHeader className="bg-gradient-to-r from-refuge-purple/10 to-refuge-magenta/10 border-b border-refuge-light-purple/20">
          <CardTitle className="flex items-center gap-2 text-refuge-purple">
            <Search className="h-5 w-5" />
            Filters
            {activeFiltersCount > 0 && (
              <Badge
                variant="secondary"
                className="bg-gradient-to-r from-refuge-purple/20 to-refuge-magenta/20 text-refuge-purple border-refuge-light-purple/30"
              >
                {activeFiltersCount} active
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-refuge-light-purple" />
              <Input
                placeholder="Search homes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 border-refuge-light-purple/30 focus:border-refuge-purple focus:ring-refuge-purple/20 bg-white/80 backdrop-blur-sm"
              />
            </div>

            {/* Unit Filter */}
            <Select value={unitFilter} onValueChange={setUnitFilter}>
              <SelectTrigger className="border-refuge-light-purple/30 focus:border-refuge-purple focus:ring-refuge-purple/20 bg-white/80 backdrop-blur-sm">
                <SelectValue placeholder="Select unit" />
              </SelectTrigger>
              <SelectContent className="z-[9999]">
                <SelectItem value="ALL">All Units</SelectItem>
                <SelectItem value="DAL">Dallas</SelectItem>
                <SelectItem value="SAN">San Antonio</SelectItem>
              </SelectContent>
            </Select>

            {/* Case Manager Filter */}
            <Select value={caseManagerFilter} onValueChange={setCaseManagerFilter}>
              <SelectTrigger className="border-refuge-light-purple/30 focus:border-refuge-purple focus:ring-refuge-purple/20 bg-white/80 backdrop-blur-sm">
                <SelectValue placeholder="Select case manager" />
              </SelectTrigger>
              <SelectContent className="z-[9999] max-h-60 overflow-y-auto">
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
              <Button
                variant="outline"
                onClick={clearFilters}
                className="border-refuge-light-purple/40 text-refuge-purple hover:bg-gradient-to-r hover:from-refuge-purple/10 hover:to-refuge-magenta/10 hover:border-refuge-purple transition-all duration-200 bg-white/80 backdrop-blur-sm"
              >
                <X className="h-4 w-4 mr-2" />
                Clear Filters
              </Button>
            )}

            {/* Refresh Button */}
            <Button
              onClick={fetchHomes}
              disabled={loading}
              className="bg-gradient-to-r from-refuge-purple to-refuge-magenta hover:from-refuge-purple/90 hover:to-refuge-magenta/90 text-white transition-all duration-200 shadow-lg"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Map and List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
        {/* Map - Takes 2/3 of the space */}
        <Card className="lg:col-span-2 border-refuge-light-purple/30 bg-gradient-to-br from-refuge-gray/20 to-white backdrop-blur-sm">
          <CardHeader className="pb-2 bg-gradient-to-r from-refuge-purple/10 to-refuge-magenta/10 border-b border-refuge-light-purple/20">
            <CardTitle className="flex items-center gap-2 text-refuge-purple">
              <MapPin className="h-5 w-5" />
              Geographic Map View
            </CardTitle>
          </CardHeader>
          <CardContent className="p-2 h-[520px]">
            {filteredHomes.length > 0 ? (
              <HomesMap homes={filteredHomes} onHomeSelect={handleHomeSelect} selectedHome={selectedHome} />
            ) : (
              <div className="flex items-center justify-center h-full bg-gradient-to-br from-refuge-purple/5 to-refuge-magenta/5 rounded-lg">
                <div className="text-center">
                  <MapPin className="h-12 w-12 text-refuge-light-purple mx-auto mb-4" />
                  <p className="text-refuge-dark-blue font-medium">No Homes with Valid Coordinates</p>
                  <p className="text-sm text-refuge-dark-blue/70 mt-1">
                    {homes.length > 0
                      ? "No homes match your current filters"
                      : "No homes found with latitude/longitude data"}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Homes List - Takes 1/3 of the space */}
        <Card className="border-refuge-light-purple/30 bg-gradient-to-br from-refuge-gray/20 to-white backdrop-blur-sm">
          <CardHeader className="pb-2 bg-gradient-to-r from-refuge-purple/10 to-refuge-magenta/10 border-b border-refuge-light-purple/20">
            <CardTitle className="flex items-center gap-2 text-refuge-purple">
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
                      ? "border-refuge-purple bg-gradient-to-r from-refuge-purple/10 to-refuge-magenta/10 shadow-md backdrop-blur-sm"
                      : "border-refuge-light-purple/20 hover:border-refuge-purple/40 hover:bg-gradient-to-r hover:from-refuge-purple/5 hover:to-refuge-magenta/5 bg-white/60 backdrop-blur-sm"
                  }`}
                  onClick={() => handleHomeSelect(home)}
                >
                  <div className="space-y-1">
                    <div className="font-semibold text-sm text-refuge-dark-blue">{home.name}</div>
                    <div className="text-xs text-refuge-dark-blue/70">{home.address}</div>
                    <div className="text-xs text-refuge-dark-blue/70">
                      {home.City}, {home.State} {home.zipCode}
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <Badge
                        className={`text-xs ${
                          home.Unit === "DAL"
                            ? "bg-gradient-to-r from-refuge-purple to-refuge-purple/80 text-white border-refuge-purple/20"
                            : "bg-gradient-to-r from-refuge-magenta to-refuge-magenta/80 text-white border-refuge-magenta/20"
                        }`}
                      >
                        {home.Unit === "DAL" ? "Dallas" : "San Antonio"}
                      </Badge>
                      <div className="text-xs text-refuge-dark-blue/50">
                        {home.latitude.toFixed(4)}, {home.longitude.toFixed(4)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {filteredHomes.length === 0 && (
                <div className="text-center py-8 text-refuge-dark-blue/70">
                  <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50 text-refuge-light-purple" />
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
