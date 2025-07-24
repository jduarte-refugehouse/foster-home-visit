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
        <span className="text-slate-700 dark:text-slate-300">Loading homes map...</span>
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center h-96">
          <div className="flex items-center gap-2">
            <RefreshCw className="h-6 w-6 animate-spin text-refuge-purple" />
            <span className="text-slate-700 dark:text-slate-300">Loading homes map...</span>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/20 rounded-xl shadow-sm">
          <CardContent className="p-6">
            <div className="text-center text-red-600 dark:text-red-400">
              <p className="font-semibold">Error loading homes map</p>
              <p className="text-sm mt-2">{error}</p>
              <Button
                onClick={fetchHomes}
                className="mt-4 bg-refuge-purple hover:bg-refuge-purple-dark text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 active:scale-95 transform shadow-sm hover:shadow-md"
              >
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-slate-100">Foster Homes Map</h1>
          <p className="text-slate-600 dark:text-slate-400 leading-relaxed mt-1">
            Interactive map showing geographic locations of foster homes
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge
            variant="secondary"
            className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-3 py-1 rounded-full"
          >
            {filteredHomes.length} homes found
          </Badge>
        </div>
      </div>

      {/* Filters */}
      <Card className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-slate-100">
            <Search className="h-5 w-5 text-refuge-purple" />
            Filters
            {activeFiltersCount > 0 && (
              <Badge
                variant="secondary"
                className="bg-refuge-purple/10 text-refuge-purple dark:bg-refuge-purple/20 dark:text-refuge-purple-light border-refuge-purple/20 px-2 py-0.5 rounded-full text-xs"
              >
                {activeFiltersCount} active
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search homes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-refuge-purple focus:border-transparent transition-all duration-200"
              />
            </div>

            {/* Unit Filter */}
            <Select value={unitFilter} onValueChange={setUnitFilter}>
              <SelectTrigger className="bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-refuge-purple focus:border-transparent transition-all duration-200">
                <SelectValue placeholder="Select unit" />
              </SelectTrigger>
              <SelectContent className="z-[9999] bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-lg shadow-lg">
                <SelectItem value="ALL">All Units</SelectItem>
                <SelectItem value="DAL">Dallas</SelectItem>
                <SelectItem value="SAN">San Antonio</SelectItem>
              </SelectContent>
            </Select>

            {/* Case Manager Filter */}
            <Select value={caseManagerFilter} onValueChange={setCaseManagerFilter}>
              <SelectTrigger className="bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-refuge-purple focus:border-transparent transition-all duration-200">
                <SelectValue placeholder="Select case manager" />
              </SelectTrigger>
              <SelectContent className="z-[9999] max-h-60 overflow-y-auto bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-lg shadow-lg">
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
                className="border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg font-medium transition-all duration-200 bg-transparent"
              >
                <X className="h-4 w-4 mr-2" />
                Clear Filters
              </Button>
            )}

            {/* Refresh Button */}
            <Button
              onClick={fetchHomes}
              disabled={loading}
              className="bg-refuge-purple hover:bg-refuge-purple-dark text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 active:scale-95 transform shadow-sm hover:shadow-md"
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
        <Card className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-slate-100">
              <MapPin className="h-5 w-5 text-refuge-purple" />
              Geographic Map View
            </CardTitle>
          </CardHeader>
          <CardContent className="p-2 h-[520px]">
            {filteredHomes.length > 0 ? (
              <HomesMap homes={filteredHomes} onHomeSelect={handleHomeSelect} selectedHome={selectedHome} />
            ) : (
              <div className="flex items-center justify-center h-full bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                <div className="text-center">
                  <MapPin className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                  <p className="text-slate-700 dark:text-slate-300 font-medium">No Homes with Valid Coordinates</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
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
        <Card className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-slate-100">
              <List className="h-5 w-5 text-refuge-purple" />
              Homes List ({filteredHomes.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-2">
            <div className="space-y-2 h-[520px] overflow-y-auto">
              {filteredHomes.map((home) => (
                <div
                  key={home.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-all duration-200 hover:shadow-sm ${
                    selectedHome?.id === home.id
                      ? "border-refuge-purple bg-refuge-purple/5 dark:bg-refuge-purple/10 shadow-sm"
                      : "border-slate-200 dark:border-slate-700 hover:border-refuge-purple/40 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                  }`}
                  onClick={() => handleHomeSelect(home)}
                >
                  <div className="space-y-1">
                    <div className="font-semibold text-sm text-slate-900 dark:text-slate-100">{home.name}</div>
                    <div className="text-xs text-slate-600 dark:text-slate-400">{home.address}</div>
                    <div className="text-xs text-slate-600 dark:text-slate-400">
                      {home.City}, {home.State} {home.zipCode}
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <Badge
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          home.Unit === "DAL"
                            ? "bg-refuge-purple/10 text-refuge-purple dark:bg-refuge-purple/20 dark:text-refuge-purple-light border-refuge-purple/20"
                            : "bg-refuge-magenta/10 text-refuge-magenta dark:bg-refuge-magenta/20 dark:text-refuge-magenta-light border-refuge-magenta/20"
                        }`}
                      >
                        {home.Unit === "DAL" ? "Dallas" : "San Antonio"}
                      </Badge>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        {home.latitude.toFixed(4)}, {home.longitude.toFixed(4)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {filteredHomes.length === 0 && (
                <div className="text-center py-8 text-slate-500 dark:text-slate-400">
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
