"use client"

import { useEffect, useState } from "react"
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MapPin, AlertCircle, Phone, Mail, User, ExternalLink } from "lucide-react"
import L from "leaflet"
import "leaflet/dist/leaflet.css"

// Fix for default markers in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
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

interface HomesMapProps {
  homes: MapHome[]
  onHomeSelect: (home: MapHome) => void
  selectedHome: MapHome | null
}

// Custom hook to fit bounds when homes change
function FitBounds({ homes }: { homes: MapHome[] }) {
  const map = useMap()

  useEffect(() => {
    if (homes.length > 0) {
      const bounds = L.latLngBounds(homes.map((home) => [home.latitude, home.longitude]))
      map.fitBounds(bounds, { padding: [20, 20] })
    }
  }, [homes, map])

  return null
}

// Create custom icons for different units
const createCustomIcon = (unit: string, isSelected: boolean) => {
  const color = unit === "DAL" ? "#22c55e" : "#ef4444" // green for Dallas, red for San Antonio
  const size = isSelected ? 35 : 25

  return L.divIcon({
    html: `
      <div style="
        background-color: ${color};
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        ${isSelected ? "box-shadow: 0 0 0 3px #3b82f6;" : ""}
      ">
        <div style="color: white; font-size: ${size > 30 ? "16px" : "12px"}; font-weight: bold;">
          🏠
        </div>
      </div>
    `,
    className: "custom-marker",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  })
}

export default function HomesMap({ homes, onHomeSelect, selectedHome }: HomesMapProps) {
  const [mapError, setMapError] = useState<string | null>(null)

  useEffect(() => {
    console.log(`🗺️ HomesMap component received ${homes.length} homes`)
    setMapError(null)
  }, [homes])

  const handleMarkerClick = (home: MapHome) => {
    console.log(`📍 Marker clicked for: ${home.name}`)
    onHomeSelect(home)
  }

  // Calculate center point of all homes for map centering
  const getMapCenter = (): [number, number] => {
    if (homes.length === 0) return [32.7767, -96.797] // Dallas default

    const avgLat = homes.reduce((sum, home) => sum + home.latitude, 0) / homes.length
    const avgLng = homes.reduce((sum, home) => sum + home.longitude, 0) / homes.length

    return [avgLat, avgLng]
  }

  if (mapError) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-50 rounded-lg">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 font-medium">Map Error</p>
          <p className="text-sm text-gray-600 mt-1">{mapError}</p>
        </div>
      </div>
    )
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

  const center = getMapCenter()

  return (
    <div className="w-full h-full relative">
      {/* React-Leaflet Map Container */}
      <div className="w-full h-full rounded-lg overflow-hidden">
        <MapContainer center={center} zoom={10} style={{ height: "100%", width: "100%" }} className="rounded-lg">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Fit bounds when homes change */}
          <FitBounds homes={homes} />

          {/* Render markers for each home */}
          {homes.map((home) => {
            const isSelected = selectedHome?.id === home.id

            return (
              <Marker
                key={home.id}
                position={[home.latitude, home.longitude]}
                icon={createCustomIcon(home.Unit, isSelected)}
                eventHandlers={{
                  click: () => handleMarkerClick(home),
                }}
              >
                <Popup>
                  <div className="min-w-[200px] p-2">
                    <h3 className="font-bold text-sm mb-2">{home.name}</h3>
                    <p className="text-xs text-gray-600 mb-1">{home.address}</p>
                    <p className="text-xs text-gray-600 mb-3">
                      {home.City}, {home.State} {home.zipCode}
                    </p>

                    {home.contactPersonName && (
                      <div className="flex items-center gap-2 mb-2">
                        <User className="h-3 w-3 text-gray-400" />
                        <span className="text-xs">{home.contactPersonName}</span>
                      </div>
                    )}

                    {home.phoneNumber && (
                      <div className="flex items-center gap-2 mb-2">
                        <Phone className="h-3 w-3 text-gray-400" />
                        <span className="text-xs">{home.phoneNumber}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between mt-3">
                      <Badge variant={home.Unit === "DAL" ? "default" : "destructive"} className="text-xs">
                        {home.Unit === "DAL" ? "Dallas" : "San Antonio"}
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs h-6 px-2 bg-transparent"
                        onClick={(e) => {
                          e.stopPropagation()
                          const url = `https://www.google.com/maps/search/?api=1&query=${home.latitude},${home.longitude}`
                          window.open(url, "_blank")
                        }}
                      >
                        <ExternalLink className="h-2 w-2 mr-1" />
                        Maps
                      </Button>
                    </div>
                  </div>
                </Popup>
              </Marker>
            )
          })}
        </MapContainer>
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
                {/* Contact Person */}
                {selectedHome.contactPersonName && (
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-400" />
                    <div>
                      <div className="font-medium">{selectedHome.contactPersonName}</div>
                      <div className="text-xs text-gray-500">Case Manager</div>
                    </div>
                  </div>
                )}

                {/* Phone */}
                {selectedHome.phoneNumber && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <div>
                      <div>{selectedHome.phoneNumber}</div>
                      <div className="text-xs text-gray-500">Home Phone</div>
                    </div>
                  </div>
                )}

                {/* Email */}
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
