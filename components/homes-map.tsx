"use client"

import { useEffect, useState, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MapPin, AlertCircle, Phone, Mail, User, ExternalLink } from "lucide-react"

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

declare global {
  interface Window {
    google: any
    initMap: () => void
  }
}

export default function HomesMap({ homes, onHomeSelect, selectedHome }: HomesMapProps) {
  const [map, setMap] = useState<any>(null)
  const [markers, setMarkers] = useState<any[]>([])
  const [mapError, setMapError] = useState<string | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    console.log(`🗺️ HomesMap component received ${homes.length} homes`)
  }, [homes])

  const handleMarkerClick = useCallback(
    (home: MapHome) => {
      console.log(`📍 Marker clicked for: ${home.name}`)
      onHomeSelect(home)
    },
    [onHomeSelect],
  )

  // Initialize Google Maps
  useEffect(() => {
    const initializeMap = async () => {
      if (typeof window !== "undefined" && window.google && homes.length > 0) {
        try {
          // Calculate center point
          const avgLat = homes.reduce((sum, home) => sum + home.latitude, 0) / homes.length
          const avgLng = homes.reduce((sum, home) => sum + home.longitude, 0) / homes.length

          const mapInstance = new window.google.maps.Map(document.getElementById("google-map"), {
            center: { lat: avgLat, lng: avgLng },
            zoom: 10,
            mapTypeId: "roadmap",
            mapId: "DEMO_MAP_ID", // Required for AdvancedMarkerElement
            styles: [
              {
                featureType: "poi",
                elementType: "labels",
                stylers: [{ visibility: "off" }],
              },
            ],
          })

          setMap(mapInstance)

          // Import AdvancedMarkerElement (new recommended approach)
          const { AdvancedMarkerElement } = await window.google.maps.importLibrary("marker")

          // Create markers using the new AdvancedMarkerElement
          const newMarkers = homes.map((home) => {
            // Create custom marker content
            const markerContent = document.createElement("div")
            markerContent.innerHTML = `
              <div style="
                width: 24px; 
                height: 24px; 
                background-color: ${home.Unit === "DAL" ? "#22c55e" : "#ef4444"}; 
                border: 2px solid white; 
                border-radius: 50%; 
                box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 12px;
                color: white;
                font-weight: bold;
              ">
                🏠
              </div>
            `

            const marker = new AdvancedMarkerElement({
              map: mapInstance,
              position: { lat: home.latitude, lng: home.longitude },
              content: markerContent,
              title: home.name,
            })

            const infoWindow = new window.google.maps.InfoWindow({
              content: `
                <div style="padding: 8px; min-width: 200px;">
                  <h3 style="font-weight: bold; margin-bottom: 8px; font-size: 14px;">${home.name}</h3>
                  <p style="font-size: 12px; color: #666; margin-bottom: 4px;">${home.address}</p>
                  <p style="font-size: 12px; color: #666; margin-bottom: 12px;">${home.City}, ${home.State} ${home.zipCode}</p>
                  ${
                    home.contactPersonName
                      ? `
                    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                      <span style="font-size: 12px;">👤 ${home.contactPersonName}</span>
                    </div>
                  `
                      : ""
                  }
                  ${
                    home.phoneNumber
                      ? `
                    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                      <span style="font-size: 12px;">📞 ${home.phoneNumber}</span>
                    </div>
                  `
                      : ""
                  }
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 12px;">
                    <span style="background: ${home.Unit === "DAL" ? "#3b82f6" : "#ef4444"}; color: white; padding: 2px 8px; border-radius: 4px; font-size: 11px;">
                      ${home.Unit === "DAL" ? "Dallas" : "San Antonio"}
                    </span>
                    <button onclick="window.open('https://www.google.com/maps/search/?api=1&query=${home.latitude},${home.longitude}', '_blank')" 
                            style="background: #f3f4f6; border: 1px solid #d1d5db; padding: 4px 8px; border-radius: 4px; font-size: 11px; cursor: pointer;">
                      🔗 Maps
                    </button>
                  </div>
                </div>
              `,
            })

            marker.addListener("click", () => {
              // Close all other info windows
              newMarkers.forEach((m) => m.infoWindow?.close())
              infoWindow.open(mapInstance, marker)
              handleMarkerClick(home)
            })

            return { marker, infoWindow, home }
          })

          setMarkers(newMarkers)

          // Fit bounds to show all markers
          if (homes.length > 1) {
            const bounds = new window.google.maps.LatLngBounds()
            homes.forEach((home) => {
              bounds.extend({ lat: home.latitude, lng: home.longitude })
            })
            mapInstance.fitBounds(bounds)
          }

          setIsLoaded(true)
          console.log("✅ Google Maps initialized successfully with AdvancedMarkerElement")
        } catch (error) {
          console.error("Error initializing Google Maps:", error)
          setMapError("Failed to initialize map: " + (error instanceof Error ? error.message : "Unknown error"))
        }
      }
    }

    // Load Google Maps API with async loading
    if (typeof window !== "undefined" && !window.google) {
      const script = document.createElement("script")
      script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyCx6DSV5XxD5D0VAuODGakQrhejpR6062M&libraries=marker&loading=async`
      script.async = true
      script.defer = true
      script.onload = initializeMap
      script.onerror = () => setMapError("Failed to load Google Maps API")
      document.head.appendChild(script)
    } else if (window.google && homes.length > 0) {
      initializeMap()
    }
  }, [homes, handleMarkerClick])

  // Update selected marker
  useEffect(() => {
    if (markers.length > 0 && selectedHome) {
      const selectedMarker = markers.find((m) => m.home.id === selectedHome.id)
      if (selectedMarker) {
        // Close all info windows
        markers.forEach((m) => m.infoWindow?.close())
        // Open selected info window
        selectedMarker.infoWindow.open(map, selectedMarker.marker)
        // Center map on selected marker
        map?.panTo({ lat: selectedHome.latitude, lng: selectedHome.longitude })
      }
    }
  }, [selectedHome, markers, map])

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
    <div className="w-full h-full relative">
      <div className="w-full h-full rounded-lg overflow-hidden">
        <div id="google-map" className="w-full h-full rounded-lg" />

        {!isLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span>Loading map...</span>
            </div>
          </div>
        )}
      </div>

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
