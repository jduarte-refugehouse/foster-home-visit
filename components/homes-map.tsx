"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { RefreshCw, MapPin, X, Search } from "lucide-react"

// Define interfaces
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

interface HomesMapProps {
  homes: MapHome[]
  onHomeSelect?: (home: MapHome) => void
  selectedHome?: MapHome | null
}

export default function HomesMap({ homes, onHomeSelect, selectedHome }: HomesMapProps) {
  const [filteredHomes, setFilteredHomes] = useState<MapHome[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedUnit, setSelectedUnit] = useState<string>("ALL")
  const [selectedCaseManager, setSelectedCaseManager] = useState<string>("ALL")
  const [caseManagers, setCaseManagers] = useState<string[]>([])
  const mapRef = useRef<any>(null)
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const markersRef = useRef<Map<string, any>>(new Map())

  useEffect(() => {
    // Dynamically import Leaflet only on client side
    const initializeMap = async () => {
      if (typeof window === "undefined" || !mapContainerRef.current) return

      try {
        // Dynamic imports for Leaflet
        const L = await import("leaflet")
        await import("leaflet/dist/leaflet.css")

        // Fix for default markers in Next.js
        delete (L.Icon.Default.prototype as any)._getIconUrl
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
          iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
          shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
        })

        // Initialize map if not already created
        if (!mapRef.current && mapContainerRef.current) {
          mapRef.current = L.map(mapContainerRef.current).setView([32.7767, -96.797], 7) // Texas center

          L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: "© OpenStreetMap contributors",
          }).addTo(mapRef.current)
        }

        const map = mapRef.current

        // Clear existing markers
        markersRef.current.forEach((marker) => {
          map.removeLayer(marker)
        })
        markersRef.current.clear()

        if (homes.length === 0) return

        // Create custom icon for selected home
        const selectedIcon = L.divIcon({
          html: `
            <div style="
              background: linear-gradient(45deg, #3b82f6, #1d4ed8);
              color: white;
              width: 32px;
              height: 32px;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              font-weight: bold;
              font-size: 14px;
              border: 3px solid white;
              box-shadow: 0 4px 8px rgba(0,0,0,0.3);
              position: relative;
            ">
              📍
            </div>
          `,
          className: "custom-selected-icon",
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        })

        // Create default icon
        const defaultIcon = L.divIcon({
          html: `
            <div style="
              background: linear-gradient(45deg, #6b7280, #4b5563);
              color: white;
              width: 24px;
              height: 24px;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              font-weight: bold;
              font-size: 12px;
              border: 2px solid white;
              box-shadow: 0 2px 4px rgba(0,0,0,0.2);
            ">
              📍
            </div>
          `,
          className: "custom-default-icon",
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        })

        // Add markers for each home
        homes.forEach((home) => {
          const isSelected = selectedHome?.id === home.id
          const icon = isSelected ? selectedIcon : defaultIcon

          // Format last sync date
          const formatLastSync = (lastSync: string) => {
            if (!lastSync) return "Never"
            try {
              const date = new Date(lastSync)
              return (
                date.toLocaleDateString() + " " + date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
              )
            } catch {
              return "Invalid date"
            }
          }

          // Create detailed popup content
          const popupContent = `
            <div style="min-width: 280px; max-width: 320px; font-family: system-ui, -apple-system, sans-serif;">
              <h3 style="margin: 0 0 12px 0; font-size: 18px; font-weight: bold; color: #1f2937; line-height: 1.3;">
                ${home.name}
              </h3>
              <div style="display: grid; gap: 8px;">
                <div style="display: flex; align-items: flex-start; gap: 8px;">
                  <span style="color: #6b7280; font-weight: 500; min-width: 70px;">Address:</span>
                  <span style="color: #374151;">${home.address}</span>
                </div>
                <div style="display: flex; align-items: center; gap: 8px;">
                  <span style="color: #6b7280; font-weight: 500; min-width: 70px;">Location:</span>
                  <span style="color: #374151;">${home.City || "N/A"}, ${home.State || "N/A"} ${home.zipCode}</span>
                </div>
                <div style="display: flex; align-items: center; gap: 8px;">
                  <span style="color: #6b7280; font-weight: 500; min-width: 70px;">Unit:</span>
                  <span style="
                    background-color: ${home.Unit === "DAL" ? "#dbeafe" : "#fecaca"}; 
                    color: ${home.Unit === "DAL" ? "#1d4ed8" : "#dc2626"}; 
                    padding: 4px 12px; 
                    border-radius: 16px; 
                    font-size: 14px; 
                    font-weight: 600;
                  ">
                    ${home.Unit === "DAL" ? "Dallas" : "San Antonio"}
                  </span>
                </div>
                ${
                  home.phoneNumber
                    ? `
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="color: #6b7280; font-weight: 500; min-width: 70px;">Phone:</span>
                    <span style="color: #374151;">${home.phoneNumber}</span>
                  </div>
                `
                    : ""
                }
                ${
                  home.contactPersonName && home.contactPersonName !== "~unassigned~"
                    ? `
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="color: #6b7280; font-weight: 500; min-width: 70px;">Contact:</span>
                    <span style="color: #374151;">${home.contactPersonName}</span>
                  </div>
                `
                    : ""
                }
                ${
                  home.contactPhone && home.contactPhone !== home.phoneNumber
                    ? `
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="color: #6b7280; font-weight: 500; min-width: 70px;">Contact Phone:</span>
                    <span style="color: #374151;">${home.contactPhone}</span>
                  </div>
                `
                    : ""
                }
                ${
                  home.email
                    ? `
                  <div style="display: flex; align-items: flex-start; gap: 8px;">
                    <span style="color: #6b7280; font-weight: 500; min-width: 70px;">Email:</span>
                    <span style="color: #374151; word-break: break-word;">${home.email}</span>
                  </div>
                `
                    : ""
                }
                <div style="display: flex; align-items: center; gap: 8px;">
                  <span style="color: #6b7280; font-weight: 500; min-width: 70px;">Last Sync:</span>
                  <span style="color: #374151;">${formatLastSync(home.lastSync)}</span>
                </div>
              </div>
              <div style="margin-top: 12px; padding-top: 8px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #9ca3af;">
                Coordinates: ${home.latitude.toFixed(6)}, ${home.longitude.toFixed(6)}
              </div>
            </div>
          `

          const marker = L.marker([home.latitude, home.longitude], { icon })
            .bindPopup(popupContent, {
              maxWidth: 350,
              className: "custom-popup",
            })
            .on("click", () => {
              console.log(`🎯 Home selected on map: ${home.name}`)
              onHomeSelect?.(home)
            })
            .addTo(map)

          markersRef.current.set(home.id, marker)
        })

        // Fit map to show all markers
        if (homes.length > 0) {
          const coordinates = homes.map((home) => [home.latitude, home.longitude] as [number, number])
          const bounds = L.latLngBounds(coordinates)
          map.fitBounds(bounds.pad(0.1))
        }
      } catch (error) {
        console.error("Error initializing map:", error)
      }
    }

    initializeMap()

    return () => {
      // Cleanup function - markers will be cleared in the next render
    }
  }, [homes, selectedHome, onHomeSelect])

  // Update marker styles when selection changes
  useEffect(() => {
    if (!selectedHome || typeof window === "undefined") return

    const updateMarkerStyles = async () => {
      try {
        const L = await import("leaflet")

        // Update all markers to show selection state
        markersRef.current.forEach((marker, homeId) => {
          const isSelected = homeId === selectedHome.id

          // Create appropriate icon
          const icon = isSelected
            ? L.divIcon({
                html: `
                  <div style="
                    background: linear-gradient(45deg, #3b82f6, #1d4ed8);
                    color: white;
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: bold;
                    font-size: 14px;
                    border: 3px solid white;
                    box-shadow: 0 4px 8px rgba(0,0,0,0.3);
                    position: relative;
                    animation: pulse 2s infinite;
                  ">
                    📍
                  </div>
                `,
                className: "custom-selected-icon",
                iconSize: [32, 32],
                iconAnchor: [16, 16],
              })
            : L.divIcon({
                html: `
                  <div style="
                    background: linear-gradient(45deg, #6b7280, #4b5563);
                    color: white;
                    width: 24px;
                    height: 24px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: bold;
                    font-size: 12px;
                    border: 2px solid white;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                  ">
                    📍
                  </div>
                `,
                className: "custom-default-icon",
                iconSize: [24, 24],
                iconAnchor: [12, 12],
              })

          marker.setIcon(icon)
        })
      } catch (error) {
        console.error("Error updating marker styles:", error)
      }
    }

    updateMarkerStyles()
  }, [selectedHome])

  useEffect(() => {
    return () => {
      // Cleanup map on unmount
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
      markersRef.current.clear()
    }
  }, [])

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

    if (selectedUnit !== "ALL") {
      filtered = filtered.filter((home) => home.Unit === selectedUnit)
    }

    if (selectedCaseManager !== "ALL") {
      filtered = filtered.filter((home) => home.contactPersonName === selectedCaseManager)
    }

    setFilteredHomes(filtered)
  }, [homes, searchTerm, selectedUnit, selectedCaseManager])

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
        <Button onClick={() => onHomeSelect?.(null)} variant="outline" size="sm">
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
                <div ref={mapContainerRef} className="w-full h-full rounded-lg" style={{ minHeight: "400px" }} />
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
                        onClick={() => onHomeSelect?.(home)}
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
      <style jsx>{`
        @keyframes pulse {
          0% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.1);
          }
          100% {
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  )
}
