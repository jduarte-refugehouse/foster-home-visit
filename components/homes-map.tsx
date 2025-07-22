"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MapPin, AlertCircle, Phone, Mail, User } from "lucide-react"

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
  const [mapError, setMapError] = useState<string | null>(null)

  useEffect(() => {
    console.log(`🗺️ HomesMap component received ${homes.length} homes`)
    setMapError(null)
  }, [homes])

  const handleMarkerClick = (home: MapHome) => {
    console.log(`📍 Marker clicked for: ${home.name}`)
    onHomeSelect(home)
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

  return (
    <div className="w-full h-full relative bg-gradient-to-br from-blue-50 to-green-50 rounded-lg overflow-hidden">
      {/* Map Background Pattern */}
      <div className="absolute inset-0 opacity-20">
        <svg className="w-full h-full" viewBox="0 0 400 300">
          {/* Simple map-like background */}
          <path d="M50 50 Q100 30 150 50 T250 50 Q300 70 350 50" stroke="#3b82f6" strokeWidth="2" fill="none" />
          <path d="M30 100 Q80 80 130 100 T230 100 Q280 120 330 100" stroke="#3b82f6" strokeWidth="2" fill="none" />
          <path d="M70 150 Q120 130 170 150 T270 150 Q320 170 370 150" stroke="#3b82f6" strokeWidth="2" fill="none" />
          <path d="M40 200 Q90 180 140 200 T240 200 Q290 220 340 200" stroke="#3b82f6" strokeWidth="2" fill="none" />
        </svg>
      </div>

      {/* Home Markers */}
      <div className="absolute inset-0 p-4">
        {homes.map((home, index) => {
          const isSelected = selectedHome?.id === home.id
          const x = 10 + (index % 8) * 11 // Distribute across width
          const y = 10 + Math.floor(index / 8) * 15 // Stack vertically

          return (
            <div
              key={home.id}
              className="absolute cursor-pointer transform -translate-x-1/2 -translate-y-1/2 group"
              style={{
                left: `${Math.min(x, 90)}%`,
                top: `${Math.min(y, 85)}%`,
              }}
              onClick={() => handleMarkerClick(home)}
            >
              {/* Marker */}
              <div
                className={`w-6 h-6 rounded-full border-2 border-white shadow-lg transition-all duration-200 ${
                  isSelected
                    ? "bg-blue-600 scale-125 z-20"
                    : home.Unit === "DAL"
                      ? "bg-green-500 hover:scale-110"
                      : "bg-red-500 hover:scale-110"
                } group-hover:scale-125`}
              >
                <MapPin className="w-4 h-4 text-white absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
              </div>

              {/* Tooltip on hover */}
              <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-30 pointer-events-none">
                <div className="bg-white rounded-lg shadow-lg p-3 min-w-48 border">
                  <div className="font-semibold text-sm">{home.name}</div>
                  <div className="text-xs text-gray-600 mt-1">{home.address}</div>
                  <div className="text-xs text-gray-600">
                    {home.City}, {home.State} {home.zipCode}
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant={home.Unit === "DAL" ? "default" : "destructive"} className="text-xs">
                      {home.Unit === "DAL" ? "Dallas" : "San Antonio"}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Selected Home Details Panel */}
      {selectedHome && (
        <div className="absolute bottom-4 left-4 right-4 z-40">
          <Card className="shadow-lg border-2 border-blue-200">
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
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-400" />
                  <div>
                    <div className="font-medium">{selectedHome.contactPersonName}</div>
                    <div className="text-xs text-gray-500">Case Manager</div>
                  </div>
                </div>

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
                <div className="text-xs text-gray-500">
                  Coordinates: {selectedHome.latitude.toFixed(6)}, {selectedHome.longitude.toFixed(6)}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

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

      {/* Map Attribution */}
      <div className="absolute bottom-2 right-2 text-xs text-gray-500 bg-white px-2 py-1 rounded z-20">
        Interactive Map View • {homes.length} homes
      </div>
    </div>
  )
}
