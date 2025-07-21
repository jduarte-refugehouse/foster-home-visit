"use client"

import { useState, useEffect, useCallback } from "react"
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { RefreshCw, MapPin, Phone, Mail, User, X, Search } from "lucide-react"
import "leaflet/dist/leaflet.css"
import L from "leaflet"

// Fix for default markers in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
})

interface Home {
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

export default function HomesMap() {
  const [homes, setHomes] = useState<Home[]>([])
  const [filteredHomes, setFilteredHomes] = useState<Home[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedHome, setSelectedHome] = useState<Home | null>(null)

  // Filters
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedUnit, setSelectedUnit] = useState<string>("ALL")
  const [selectedCaseManager, setSelectedCaseManager] = useState<string>("ALL")
  const [caseManagers, setCaseManagers] = useState<string[]>([])

  const fetchHomes = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams()
      if (selectedUnit !== "ALL") params.append("unit", selectedUnit)
      if (selectedCaseManager !== "ALL") params.append("caseManager", selectedCaseManager)

      const response = await fetch(`/api/homes-for-map?${params}`)
      const data = await response.json()

      if (data.success) {
        setHomes(data.homes)
      } else {
        setError(data.error || "Failed to fetch homes")
      }
    } catch (err) {
      setError("Network error occurred")
      console.error("Error fetching homes:", err)
    } finally {
      setLoading(false)
    }
  }, [selectedUnit, selectedCaseManager])

  const fetchCaseManagers = useCallback(async () => {
    try {
      const response = await fetch("/api/homes-list")
      const data = await response.json()

      if (data.success) {
        const uniqueManagers = [...new Set(data.homes.map((h: Home) => h.contactPersonName))].filter(Boolean).sort()
        setCaseManagers(uniqueManagers)
      }
    } catch (err) {
      console.error("Error fetching case managers:", err)
    }
  }, [])

  useEffect(() => {
    fetchHomes()
    fetchCaseManagers()
  }, [fetchHomes, fetchCaseManagers])

  useEffect(() => {
    let filtered = homes

    if (searchTerm) {
      filtered = filtered.filter(
        (home) =>
          home.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          home.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
          home.contactPersonName.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    setFilteredHomes(filtered)
  }, [homes, searchTerm])

  const clearFilters = () => {
    setSearchTerm("")
    setSelectedUnit("ALL")
    setSelectedCaseManager("ALL")
  }

  const activeFiltersCount = [
    searchTerm,
    selectedUnit !== "ALL" ? selectedUnit : null,
    selectedCaseManager !== "ALL" ? selectedCaseManager : null,
  ].filter(Boolean).length

  const handleHomeClick = (home: Home) => {
    setSelectedHome(home)
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[600px]">
          <div className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span>Loading homes...</span>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card className="border-red-200">
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-red-600 mb-4">Error: {error}</p>
              <Button onClick={fetchHomes} variant="outline">
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
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Homes Map</h1>
          <p className="text-gray-600">
            Interactive map showing {filteredHomes.length} of {homes.length} homes
          </p>
        </div>
        <Button onClick={fetchHomes} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              <span className="text-sm font-medium">Filters</span>
              {activeFiltersCount > 0 && <Badge variant="secondary">{activeFiltersCount} active</Badge>}
            </div>

            <div className="flex-1 min-w-[200px]">
              <Input placeholder="Search homes..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>

            <Select value={selectedUnit} onValueChange={setSelectedUnit}>
              <SelectTrigger className="w-[140px]" style={{ zIndex: 1000 }}>
                <SelectValue placeholder="All Units" />
              </SelectTrigger>
              <SelectContent style={{ zIndex: 1001 }}>
                <SelectItem value="ALL">All Units</SelectItem>
                <SelectItem value="DAL">Dallas</SelectItem>
                <SelectItem value="SAN">San Antonio</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedCaseManager} onValueChange={setSelectedCaseManager}>
              <SelectTrigger className="w-[180px]" style={{ zIndex: 1000 }}>
                <SelectValue placeholder="All Case Managers" />
              </SelectTrigger>
              <SelectContent style={{ zIndex: 1001 }}>
                <SelectItem value="ALL">All Case Managers</SelectItem>
                {caseManagers.map((manager) => (
                  <SelectItem key={manager} value={manager}>
                    {manager}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {activeFiltersCount > 0 && (
              <Button onClick={clearFilters} variant="ghost" size="sm">
                <X className="h-4 w-4 mr-2" />
                Clear Filters
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Map and List Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map - 2/3 width */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Interactive Map
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="h-[600px] relative">
                <MapContainer
                  center={[32.7767, -96.797]} // Dallas center
                  zoom={7}
                  style={{ height: "100%", width: "100%" }}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  {filteredHomes.map((home) => (
                    <Marker
                      key={home.id}
                      position={[home.latitude, home.longitude]}
                      eventHandlers={{
                        click: () => handleHomeClick(home),
                      }}
                    >
                      <Popup>
                        <div className="p-2 min-w-[250px]">
                          <h3 className="font-semibold text-lg mb-2">{home.name}</h3>

                          <div className="space-y-2 text-sm">
                            <div className="flex items-start gap-2">
                              <MapPin className="h-4 w-4 mt-0.5 text-gray-500" />
                              <div>
                                <div>{home.address}</div>
                                <div className="text-gray-600">
                                  {home.City}, {home.State} {home.zipCode}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <Badge variant={home.Unit === "DAL" ? "default" : "secondary"}>{home.Unit}</Badge>
                            </div>

                            {home.phoneNumber && (
                              <div className="flex items-center gap-2">
                                <Phone className="h-4 w-4 text-gray-500" />
                                <span>{home.phoneNumber}</span>
                              </div>
                            )}

                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-gray-500" />
                              <span>{home.contactPersonName}</span>
                            </div>

                            {home.email && (
                              <div className="flex items-center gap-2">
                                <Mail className="h-4 w-4 text-gray-500" />
                                <span className="text-xs">{home.email}</span>
                              </div>
                            )}

                            {home.contactPhone && (
                              <div className="flex items-center gap-2">
                                <Phone className="h-4 w-4 text-gray-500" />
                                <span>Contact: {home.contactPhone}</span>
                              </div>
                            )}

                            <div className="text-xs text-gray-500 pt-2 border-t">
                              Coordinates: {home.latitude.toFixed(6)}, {home.longitude.toFixed(6)}
                            </div>
                          </div>
                        </div>
                      </Popup>
                    </Marker>
                  ))}
                </MapContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Homes List - 1/3 width */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 bg-blue-600 rounded-full"></div>
                  Homes List ({filteredHomes.length})
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-[600px] overflow-y-auto">
                {filteredHomes.length === 0 ? (
                  <div className="p-6 text-center text-gray-500">
                    <MapPin className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p>No homes found matching your filters</p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {filteredHomes.map((home) => (
                      <div
                        key={home.id}
                        className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                          selectedHome?.id === home.id ? "bg-blue-50 border-l-4 border-l-blue-600" : ""
                        }`}
                        onClick={() => handleHomeClick(home)}
                      >
                        <div className="space-y-2">
                          <div className="font-medium text-sm">{home.name}</div>
                          <div className="text-xs text-gray-600 flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {home.address}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
