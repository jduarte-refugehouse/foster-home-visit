"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { MapPin, Filter, RotateCcw, Users, Building, Search, Phone, Mail, ArrowLeft } from "lucide-react"
import Link from "next/link"
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
  const [searchFilter, setSearchFilter] = useState<string>("")
  const [caseManagers, setCaseManagers] = useState<string[]>([])
  const [unitSummary, setUnitSummary] = useState<Record<string, number>>({})
  const [selectedHome, setSelectedHome] = useState<MapHome | null>(null)

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
    setSearchFilter("")
    setSelectedHome(null)
  }

  // Filter homes based on search
  const filteredHomes = homes.filter((home) => {
    if (!searchFilter) return true
    const searchLower = searchFilter.toLowerCase()
    return (
      home.name.toLowerCase().includes(searchLower) ||
      home.address.toLowerCase().includes(searchLower) ||
      home.City?.toLowerCase().includes(searchLower) ||
      home.contactPersonName?.toLowerCase().includes(searchLower)
    )
  })

  const hasActiveFilters = unitFilter !== "ALL" || caseManagerFilter !== "ALL" || searchFilter !== ""

  const handleHomeSelect = (home: MapHome) => {
    setSelectedHome(home)
    // Scroll to the selected home in the list
    const element = document.getElementById(`home-${home.id}`)
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" })
    }
  }

  const handleHomeClick = (home: MapHome) => {
    setSelectedHome(home)
  }

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
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Homes Map</h1>
              <p className="text-gray-600 mt-1">
                Interactive map showing {filteredHomes.length} foster homes
                {filteredHomes.length !== homes.length && ` (filtered from ${homes.length})`}
              </p>
            </div>
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
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Search</label>
                <div className="relative">
                  <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Search homes, addresses, contacts..."
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Unit</label>
                <Select value={unitFilter} onValueChange={setUnitFilter}>
                  <SelectTrigger>
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
                  <SelectTrigger>
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

              <div className="flex items-end">
                {hasActiveFilters && (
                  <Button onClick={clearFilters} variant="outline" size="sm" className="w-full bg-transparent">
                    Clear Filters
                  </Button>
                )}
              </div>
            </div>

            {/* Active Filters Display */}
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
                {searchFilter && (
                  <Badge variant="outline">
                    <Search className="h-3 w-3 mr-1" />
                    Search: "{searchFilter}"
                  </Badge>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Main Content: Map and List Side by Side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[700px]">
          {/* Map */}
          <Card className="h-full">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Interactive Map
                </span>
                <Badge variant="outline">{filteredHomes.length} homes</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 h-[calc(100%-80px)]">
              <HomesMap homes={filteredHomes} onHomeSelect={handleHomeSelect} selectedHome={selectedHome} />
            </CardContent>
          </Card>

          {/* Homes List */}
          <Card className="h-full">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between">
                <span>Homes List</span>
                <div className="flex gap-2">
                  <Badge variant="secondary">{unitSummary.DAL || 0} Dallas</Badge>
                  <Badge variant="secondary">{unitSummary.SAN || 0} San Antonio</Badge>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 h-[calc(100%-80px)] overflow-y-auto">
              <div className="space-y-2 p-4">
                {filteredHomes.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <MapPin className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No homes found with current filters</p>
                    {hasActiveFilters && (
                      <Button onClick={clearFilters} variant="outline" size="sm" className="mt-2 bg-transparent">
                        Clear Filters
                      </Button>
                    )}
                  </div>
                ) : (
                  filteredHomes.map((home) => (
                    <div
                      key={home.id}
                      id={`home-${home.id}`}
                      className={`p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                        selectedHome?.id === home.id
                          ? "border-blue-500 bg-blue-50 shadow-md"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                      onClick={() => handleHomeClick(home)}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-lg text-gray-900 leading-tight">{home.name}</h3>
                        <Badge variant={home.Unit === "DAL" ? "default" : "destructive"} className="ml-2 flex-shrink-0">
                          {home.Unit}
                        </Badge>
                      </div>

                      <div className="space-y-1 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0" />
                          <span>
                            {home.address}
                            {home.City && `, ${home.City}`}
                            {home.State && `, ${home.State}`} {home.zipCode}
                          </span>
                        </div>

                        {home.phoneNumber && (
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-gray-400 flex-shrink-0" />
                            <span>{home.phoneNumber}</span>
                          </div>
                        )}

                        {home.contactPersonName && (
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-gray-400 flex-shrink-0" />
                            <span>{home.contactPersonName}</span>
                          </div>
                        )}

                        {home.email && (
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-gray-400 flex-shrink-0" />
                            <span className="truncate">{home.email}</span>
                          </div>
                        )}
                      </div>

                      <div className="mt-2 text-xs text-gray-400">
                        Coordinates: {home.latitude.toFixed(6)}, {home.longitude.toFixed(6)}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
