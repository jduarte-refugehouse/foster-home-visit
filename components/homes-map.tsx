"use client"

import { useEffect, useState, useCallback, useRef } from "react"
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
    initGoogleMaps: () => void
  }
}

export default function HomesMap({ homes, onHomeSelect, selectedHome }: HomesMapProps) {
  const [map, setMap] = useState<any>(null)
  const [markers, setMarkers] = useState<any[]>([])
  const [mapError, setMapError] = useState<string | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const mapRef = useRef<HTMLDivElement>(null)
  const scriptLoadedRef = useRef(false)

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

  const initializeMap = useCallback(async () => {
    if (!window.google || !window.google.maps || !mapRef.current || homes.length === 0) {
      console.log("⏳ Google Maps not ready or no homes to display")
      return
    }

    try {
      console.log("🚀 Initializing Google Maps...")
      setIsLoading(true)

      // Calculate center point
      const avgLat = homes.reduce((sum, home) => sum + home.latitude, 0) / homes.length
      const avgLng = homes.reduce((sum, home) => sum + home.longitude, 0) / homes.length

      // Create map instance
      const mapInstance = new window.google.maps.Map(mapRef.current, {
        center: { lat: avgLat, lng: avgLng },
        zoom: 10,
        mapTypeId: "roadmap",
        mapId: "DEMO_MAP_ID",
        styles: [
          {
            featureType: "poi",
            elementType: "labels",
            stylers: [{ visibility: "off" }],
          },
        ],
      })

      setMap(mapInstance)

      // Wait for map to be ready
      await new Promise((resolve) => {
        window.google.maps.event.addListenerOnce(mapInstance, "idle", resolve)
      })

      // Import AdvancedMarkerElement
      const { AdvancedMarkerElement } = await window.google.maps.importLibrary("marker")

      // Create markers
      const newMarkers = homes.map((home) => {
        // Create custom marker content
        const markerContent = document.createElement("div")
        markerContent.innerHTML = `
          <div style="
            width: 32px; 
            height: 32px; 
            background-color: ${home.Unit === "DAL" ? "#22c55e" : "#ef4444"}; 
            border: 3px solid white; 
            border-radius: 50%; 
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 16px;
            cursor: pointer;
            transition: transform 0.2s ease;
          ">
            🏠
          </div>
        `

        // Add hover effect
        markerContent.addEventListener("mouseenter", () => {
          markerContent.style.transform = "scale(1.1)"
        })
        markerContent.addEventListener("mouseleave", () => {
          markerContent.style.transform = "scale(1)"
        })

        const marker = new AdvancedMarkerElement({
          map: mapInstance,
          position: { lat: home.latitude, lng: home.longitude },
          content: markerContent,
          title: home.name,
        })

        // Only use the custom card component, no Google Maps InfoWindow
        marker.addListener("click", () => {
          handleMarkerClick(home)
        })

        return { marker, home }
      })

      setMarkers(newMarkers)

      // Fit bounds to show all markers
      if (homes.length > 1) {
        const bounds = new window.google.maps.LatLngBounds()
        homes.forEach((home) => {
          bounds.extend({ lat: home.latitude, lng: home.longitude })
        })
        mapInstance.fitBounds(bounds)

        // Ensure minimum zoom level
        const listener = window.google.maps.event.addListener(mapInstance, "bounds_changed", () => {
          if (mapInstance.getZoom() > 15) {
            mapInstance.setZoom(15)
          }
          window.google.maps.event.removeListener(listener)
        })
      }

      setIsLoaded(true)
      setMapError(null)
      console.log("✅ Google Maps initialized successfully")
    } catch (error) {
      console.error("❌ Error initializing Google Maps:", error)
      setMapError("Failed to initialize map: " + (error instanceof Error ? error.message : "Unknown error"))
    } finally {
      setIsLoading(false)
    }
  }, [homes, handleMarkerClick])

  // Load Google Maps API
  useEffect(() => {
    const loadGoogleMaps = () => {
      if (scriptLoadedRef.current) {
        initializeMap()
        return
      }

      if (typeof window !== "undefined" && !window.google) {
        console.log("📦 Loading Google Maps API...")
        const script = document.createElement("script")
        script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyCx6DSV5XxD5D0VAuODGakQrhejpR6062M&libraries=marker&loading=async&callback=initGoogleMaps`
        script.async = true
        script.defer = true

        window.initGoogleMaps = () => {
          console.log("🎯 Google Maps API loaded via callback")
          scriptLoadedRef.current = true
          initializeMap()
        }

        script.onerror = (error) => {
          console.error("❌ Failed to load Google Maps API:", error)
          setMapError("Failed to load Google Maps API. Please check your internet connection.")
        }

        document.head.appendChild(script)
      } else if (window.google) {
        console.log("♻️ Google Maps API already loaded")
        scriptLoadedRef.current = true
        initializeMap()
      }
    }

    if (homes.length > 0) {
      loadGoogleMaps()
    }
  }, [homes, initializeMap])

  // Update selected marker styling
  useEffect(() => {
    if (markers.length > 0 && map) {
      markers.forEach((markerData) => {
        const isSelected = selectedHome && markerData.home.id === selectedHome.id
        const markerElement = markerData.marker.content.querySelector("div")

        if (markerElement) {
          if (isSelected) {
            markerElement.style.transform = "scale(1.2)"
            markerElement.style.boxShadow = "0 4px 12px rgba(0,0,0,0.4)"
            markerElement.style.zIndex = "1000"
          } else {
            markerElement.style.transform = "scale(1)"
            markerElement.style.boxShadow = "0 2px 8px rgba(0,0,0,0.3)"
            markerElement.style.zIndex = "auto"
          }
        }
      })

      // Center map on selected marker
      if (selectedHome) {
        map.panTo({ lat: selectedHome.latitude, lng: selectedHome.longitude })
      }
    }
  }, [selectedHome, markers, map])

  if (mapError) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-50 rounded-lg">
        <div className="text-center p-6">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 font-medium mb-2">Map Error</p>
          <p className="text-sm text-gray-600 mb-4">{mapError}</p>
          <Button
            onClick={() => {
              setMapError(null)
              setIsLoaded(false)
              scriptLoadedRef.current = false
              initializeMap()
            }}
            variant="outline"
            size="sm"
          >
            Try Again
          </Button>
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
        <div ref={mapRef} className="w-full h-full rounded-lg" />

        {(isLoading || !isLoaded) && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span>{isLoading ? "Initializing map..." : "Loading map..."}</span>
            </div>
          </div>
        )}
      </div>

      {selectedHome && isLoaded && (
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
