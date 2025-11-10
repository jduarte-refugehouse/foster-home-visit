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

  // Create custom marker icon with brand colors
  const createMarkerIcon = useCallback((unit: string, isSelected = false) => {
    const color = unit === "DAL" ? "#5E3989" : "#A90533" // Brand purple for Dallas, brand magenta for San Antonio
    const size = isSelected ? 32 : 24

    const svgMarker = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 36" width="${size}" height="${size * 1.5}">
        <path fill="${color}" stroke="white" strokeWidth="2" 
              d="M12,2C8.13,2 5,5.13 5,9c0,5.25 7,13 7,13s7,-7.75 7,-13C19,5.13 15.87,2 12,2z"/>
        <circle fill="white" cx="12" cy="9" r="3"/>
      </svg>
    `

    return {
      url: "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(svgMarker),
      scaledSize: new window.google.maps.Size(size, size * 1.5),
      anchor: new window.google.maps.Point(size / 2, size * 1.5),
    }
  }, [])

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

      // Create markers using custom brand-colored pins
      const newMarkers = homes.map((home) => {
        const marker = new window.google.maps.Marker({
          map: mapInstance,
          position: { lat: home.latitude, lng: home.longitude },
          title: home.name,
          icon: createMarkerIcon(home.Unit, false),
        })

        // Add click listener
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
  }, [homes, handleMarkerClick, createMarkerIcon])

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
        const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
        if (!apiKey) {
          console.error("❌ Google Maps API key not configured. Please set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY")
          setMapError("Google Maps API key not configured")
          return
        }
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=marker&loading=async&callback=initGoogleMaps`
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

        // Update marker icon based on selection
        markerData.marker.setIcon(createMarkerIcon(markerData.home.Unit, isSelected))
      })

      // Center map on selected marker
      if (selectedHome) {
        map.panTo({ lat: selectedHome.latitude, lng: selectedHome.longitude })
      }
    }
  }, [selectedHome, markers, map, createMarkerIcon])

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
