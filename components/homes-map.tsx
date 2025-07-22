"use client"

import { useEffect } from "react"
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
  useEffect(() => {
    console.log(`🗺️ HomesMap component received ${homes.length} homes`)
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

  return (
    <div className="w-full h-full relative">
      {/* Simple Map View */}
      <div className="w-full h-full rounded-lg overflow-hidden bg-gradient-to-br from-green-50 to-blue-50 relative border">
        {/* Map Grid */}
        <div className="absolute inset-0 opacity-20">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            {[20, 40, 60, 80].map((x) => (
              <line key={`v${x}`} x1={x} y1="0" x2={x} y2="100" stroke="#94a3b8" strokeWidth="0.5" />
            ))}
            {[20, 40, 60, 80].map((y) => (
              <line key={`h${y}`} x1="0" y1={y} x2="100" y2={y} stroke="#94a3b8" strokeWidth="0.5" />
            ))}
          </svg>
        </div>

        {/* Homes List as Cards */}
        <div className="absolute inset-4 overflow-y-auto space-y-2">
          {homes.map((home, index) => (
            <div
              key={home.id}
              className={`p-3 rounded-lg border cursor-pointer transition-all hover:shadow-md bg-white/90 backdrop-blur-sm ${
                selectedHome?.id === home.id
                  ? "border-blue-500 bg-blue-50/90 shadow-md"
                  : "border-gray-200 hover:border-gray-300"
              }`}
              onClick={() => handleMarkerClick(home)}
            >
              <div className="flex items-start justify-between">
                <div className="space-y-1 flex-1">
                  <div className="font-semibold text-sm">{home.name}</div>
                  <div className="text-xs text-muted-foreground">{home.address}</div>
                  <div className="text-xs text-muted-foreground">
                    {home.City}, {home.State} {home.zipCode}
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant={home.Unit === "DAL" ? "default" : "destructive"} className="text-xs">
                      {home.Unit === "DAL" ? "Dallas" : "San Antonio"}
                    </Badge>
                    <div className="text-xs text-gray-400">
                      {home.latitude.toFixed(4)}, {home.longitude.toFixed(4)}
                    </div>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs h-6 px-2 ml-2 bg-transparent"
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
          ))}
        </div>

        {/* Map Legend */}
        <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-3 z-30">
          <div className="text-sm font-medium mb-2">Legend</div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span>Dallas ({homes.filter((h) => h.Unit === "DAL").length})</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span>San Antonio ({homes.filter((h) => h.Unit === "SAN").length})</span>
            </div>
          </div>
        </div>

        {/* Coordinate Info */}
        <div className="absolute bottom-2 left-2 text-xs text-gray-500 bg-white px-2 py-1 rounded z-20">
          {homes.length} homes displayed
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
