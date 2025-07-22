"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MapPin, Phone, Mail, User, ExternalLink } from "lucide-react"

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
  onHomeSelect: (home: MapHome) => void
  selectedHome: MapHome | null
}

export default function HomesMap({ homes, onHomeSelect, selectedHome }: HomesMapProps) {
  const [mapBounds, setMapBounds] = useState({ minLat: 0, maxLat: 0, minLng: 0, maxLng: 0 })

  useEffect(() => {
    console.log(`🗺️ HomesMap component received ${homes.length} homes`)

    if (homes.length > 0) {
      const latitudes = homes.map((h) => h.latitude)
      const longitudes = homes.map((h) => h.longitude)

      setMapBounds({
        minLat: Math.min(...latitudes),
        maxLat: Math.max(...latitudes),
        minLng: Math.min(...longitudes),
        maxLng: Math.max(...longitudes),
      })
    }
  }, [homes])

  const handleMarkerClick = (home: MapHome) => {
    console.log(`📍 Marker clicked for: ${home.name}`)
    onHomeSelect(home)
  }

  if (homes.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-50 rounded-lg">
        <div className="text-center">
          <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">No Homes to Display</p>
          <p className="text-sm text-gray-500 mt-1">No homes with valid coordinates found</p>
        </div>
      </div>
    )
  }

  // Convert lat/lng to pixel positions on the map
  const getMarkerPosition = (home: MapHome) => {
    const { minLat, maxLat, minLng, maxLng } = mapBounds

    // Add padding to prevent markers from being too close to edges
    const padding = 0.1
    const latRange = maxLat - minLat || 1
    const lngRange = maxLng - minLng || 1

    const x = ((home.longitude - minLng) / lngRange) * (100 - 2 * padding * 100) + padding * 100
    const y = ((maxLat - home.latitude) / latRange) * (100 - 2 * padding * 100) + padding * 100

    return {
      left: `${Math.max(5, Math.min(95, x))}%`,
      top: `${Math.max(5, Math.min(95, y))}%`,
    }
  }

  return (
    <div className="w-full h-full relative">
      {/* Map Background with Tile-like Pattern */}
      <div className="w-full h-full rounded-lg overflow-hidden bg-gradient-to-br from-green-100 via-blue-50 to-green-50 relative border">
        {/* Map Grid Pattern */}
        <div className="absolute inset-0">
          <svg className="w-full h-full opacity-30" viewBox="0 0 100 100" preserveAspectRatio="none">
            {/* Major grid lines */}
            {[0, 25, 50, 75, 100].map((x) => (
              <line key={`major-v${x}`} x1={x} y1="0" x2={x} y2="100" stroke="#059669" strokeWidth="0.3" />
            ))}
            {[0, 25, 50, 75, 100].map((y) => (
              <line key={`major-h${y}`} x1="0" y1={y} x2="100" y2={y} stroke="#059669" strokeWidth="0.3" />
            ))}
            {/* Minor grid lines */}
            {[12.5, 37.5, 62.5, 87.5].map((x) => (
              <line key={`minor-v${x}`} x1={x} y1="0" x2={x} y2="100" stroke="#10b981" strokeWidth="0.1" />
            ))}
            {[12.5, 37.5, 62.5, 87.5].map((y) => (
              <line key={`minor-h${y}`} x1="0" y1={y} x2="100" y2={y} stroke="#10b981" strokeWidth="0.1" />
            ))}
          </svg>
        </div>

        {/* Geographic Features Simulation */}
        <div className="absolute inset-0 opacity-20">
          {/* Simulate roads/highways */}
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <path d="M10,30 Q30,25 50,35 T90,40" stroke="#6b7280" strokeWidth="0.8" fill="none" />
            <path d="M20,60 Q40,55 60,65 T85,70" stroke="#6b7280" strokeWidth="0.6" fill="none" />
            <path d="M30,10 L35,90" stroke="#6b7280" strokeWidth="0.5" fill="none" />
            <path d="M70,15 L75,85" stroke="#6b7280" strokeWidth="0.5" fill="none" />
          </svg>
        </div>

        {/* Home Markers */}
        {homes.map((home) => {
          const position = getMarkerPosition(home)
          const isSelected = selectedHome?.id === home.id
          const isDallas = home.Unit === "DAL"

          return (
            <div
              key={home.id}
              className="absolute cursor-pointer transform -translate-x-1/2 -translate-y-1/2 group z-10"
              style={position}
              onClick={() => handleMarkerClick(home)}
            >
              {/* Marker Pin */}
              <div
                className={`relative transition-all duration-200 ${isSelected ? "scale-125 z-20" : "hover:scale-110"}`}
              >
                {/* Pin Shadow */}
                <div className="absolute top-1 left-1 w-6 h-6 bg-black/20 rounded-full blur-sm"></div>

                {/* Pin Body */}
                <div
                  className={`w-6 h-6 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-white text-xs font-bold ${
                    isSelected
                      ? "bg-blue-600 ring-2 ring-blue-300"
                      : isDallas
                        ? "bg-green-600 hover:bg-green-700"
                        : "bg-red-600 hover:bg-red-700"
                  }`}
                >
                  🏠
                </div>

                {/* Pin Point */}
                <div
                  className={`absolute top-5 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-t-4 border-transparent ${
                    isSelected ? "border-t-blue-600" : isDallas ? "border-t-green-600" : "border-t-red-600"
                  }`}
                ></div>
              </div>

              {/* Hover Tooltip */}
              <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-30 pointer-events-none">
                <div className="bg-white rounded-lg shadow-lg p-3 min-w-48 border">
                  <div className="font-semibold text-sm">{home.name}</div>
                  <div className="text-xs text-gray-600 mt-1">{home.address}</div>
                  <div className="text-xs text-gray-600">
                    {home.City}, {home.State} {home.zipCode}
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant={isDallas ? "default" : "destructive"} className="text-xs">
                      {isDallas ? "Dallas" : "San Antonio"}
                    </Badge>
                  </div>
                  {/* Tooltip Arrow */}
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-white"></div>
                </div>
              </div>
            </div>
          )
        })}

        {/* Map Legend */}
        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-3 z-30">
          <div className="text-sm font-medium mb-2">Legend</div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs">
              <div className="w-4 h-4 bg-green-600 rounded-full border border-white shadow-sm flex items-center justify-center text-white text-xs">
                🏠
              </div>
              <span>Dallas ({homes.filter((h) => h.Unit === "DAL").length})</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <div className="w-4 h-4 bg-red-600 rounded-full border border-white shadow-sm flex items-center justify-center text-white text-xs">
                🏠
              </div>
              <span>San Antonio ({homes.filter((h) => h.Unit === "SAN").length})</span>
            </div>
          </div>
        </div>

        {/* Coordinate Info */}
        <div className="absolute bottom-2 left-2 text-xs text-gray-600 bg-white/80 backdrop-blur-sm px-2 py-1 rounded z-20">
          {homes.length} homes • Geographic distribution
        </div>

        {/* Zoom Info */}
        <div className="absolute bottom-2 right-2 text-xs text-gray-600 bg-white/80 backdrop-blur-sm px-2 py-1 rounded z-20">
          Lat: {mapBounds.minLat.toFixed(3)} to {mapBounds.maxLat.toFixed(3)} • Lng: {mapBounds.minLng.toFixed(3)} to{" "}
          {mapBounds.maxLng.toFixed(3)}
        </div>
      </div>

      {/* Selected Home Details Panel */}
      {selectedHome && (
        <div className="absolute bottom-4 left-4 right-4 z-[1000]">
          <Card className="shadow-lg border-2 border-blue-200 bg-white">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{selectedHome.name}</CardTitle>
                  <CardDescription className="flex items-center gap-1 mt-1">
                    <MapPin className="h-3 w-3" />
                    {selectedHome.address}, {selectedHome.City}, {selectedHome.State} {selectedHome.zipCode}
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onHomeSelect(null as any)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                {selectedHome.contactPersonName && (
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-400" />
                    <div>
                      <div className="font-medium">{selectedHome.contactPersonName}</div>
                      <div className="text-xs text-gray-500">Case Manager</div>
                    </div>
                  </div>
                )}

                {selectedHome.phoneNumber && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <div>
                      <div>{selectedHome.phoneNumber}</div>
                      <div className="text-xs text-gray-500">Home Phone</div>
                    </div>
                  </div>
                )}

                {selectedHome.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <div>
                      <div className="truncate">{selectedHome.email}</div>
                      <div className="text-xs text-gray-500">Email</div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between mt-4">
                <Badge variant={selectedHome.Unit === "DAL" ? "default" : "destructive"}>
                  {selectedHome.Unit === "DAL" ? "Dallas Unit" : "San Antonio Unit"}
                </Badge>
                <div className="flex items-center gap-2">
                  <div className="text-xs text-gray-500">
                    {selectedHome.latitude.toFixed(6)}, {selectedHome.longitude.toFixed(6)}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const url = `https://www.google.com/maps/search/?api=1&query=${selectedHome.latitude},${selectedHome.longitude}`
                      window.open(url, "_blank")
                    }}
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    Google Maps
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
