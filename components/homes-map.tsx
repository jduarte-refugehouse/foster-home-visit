"use client"

import { useEffect, useRef, useState } from "react"
import L from "leaflet"
import "leaflet/dist/leaflet.css"

// Fix for default markers in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
})

// Custom icons for different units
const createCustomIcon = (unit: string) => {
  const color = unit === "DAL" ? "#3B82F6" : unit === "SAN" ? "#EF4444" : "#10B981" // Blue for Dallas, Red for San Antonio, Green for others

  return L.divIcon({
    html: `
      <div style="
        background-color: ${color};
        width: 25px;
        height: 25px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        font-size: 10px;
      ">
        ${unit === "DAL" ? "D" : unit === "SAN" ? "S" : "?"}
      </div>
    `,
    className: "custom-div-icon",
    iconSize: [25, 25],
    iconAnchor: [12, 12],
  })
}

interface Home {
  Id: number
  Name: string
  Address: string
  City: string
  State: string
  ZipCode: string
  Unit: string
  Latitude: number
  Longitude: number
  PhoneNumber?: string
  Email?: string
  Website?: string
  Description?: string
  Capacity?: number
  ServicesOffered?: string
  ContactPersonName?: string
  ContactPersonTitle?: string
}

interface HomesMapProps {
  homes: Home[]
  onHomeSelect?: (home: Home) => void
}

export default function HomesMap({ homes, onHomeSelect }: HomesMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)
  const markersRef = useRef<L.Marker[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!mapRef.current) return

    console.log("🗺️ Initializing map...")

    // Initialize map - center on Texas
    const map = L.map(mapRef.current).setView([31.0, -100.0], 6)

    // Add OpenStreetMap tiles
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
    }).addTo(map)

    mapInstanceRef.current = map
    setIsLoading(false)

    console.log("✅ Map initialized")

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    if (!mapInstanceRef.current || !homes.length) {
      console.log("⏳ Map not ready or no homes data")
      return
    }

    console.log(`🏠 Adding ${homes.length} homes to map...`)

    // Clear existing markers
    markersRef.current.forEach((marker) => {
      mapInstanceRef.current?.removeLayer(marker)
    })
    markersRef.current = []

    // Add markers for each home
    const validMarkers: L.Marker[] = []

    homes.forEach((home) => {
      if (home.Latitude && home.Longitude && !isNaN(home.Latitude) && !isNaN(home.Longitude)) {
        console.log(`📍 Adding marker for ${home.Name} (${home.Unit}) at ${home.Latitude}, ${home.Longitude}`)

        const marker = L.marker([home.Latitude, home.Longitude], {
          icon: createCustomIcon(home.Unit),
        })
          .bindPopup(`
            <div class="p-2">
              <h3 class="font-bold text-sm mb-1">${home.Name}</h3>
              <p class="text-xs text-gray-600 mb-1">
                <span class="inline-block px-2 py-1 rounded text-xs font-medium ${
                  home.Unit === "DAL"
                    ? "bg-blue-100 text-blue-800"
                    : home.Unit === "SAN"
                      ? "bg-red-100 text-red-800"
                      : "bg-green-100 text-green-800"
                }">
                  ${home.Unit === "DAL" ? "Dallas" : home.Unit === "SAN" ? "San Antonio" : home.Unit}
                </span>
              </p>
              <p class="text-xs text-gray-700 mb-2">${home.Address}<br>${home.City}, ${home.State} ${home.ZipCode}</p>
              ${home.PhoneNumber ? `<p class="text-xs"><strong>Phone:</strong> ${home.PhoneNumber}</p>` : ""}
              ${home.Email ? `<p class="text-xs"><strong>Email:</strong> ${home.Email}</p>` : ""}
              ${home.Capacity ? `<p class="text-xs"><strong>Capacity:</strong> ${home.Capacity}</p>` : ""}
            </div>
          `)
          .on("click", () => {
            console.log(`🎯 Home selected: ${home.Name}`)
            onHomeSelect?.(home)
          })
          .addTo(mapInstanceRef.current!)

        validMarkers.push(marker)
        markersRef.current.push(marker)
      } else {
        console.warn(`❌ Invalid coordinates for ${home.Name}: lat=${home.Latitude}, lng=${home.Longitude}`)
      }
    })

    // Fit map to show all markers
    if (validMarkers.length > 0) {
      const group = new L.FeatureGroup(validMarkers)
      const bounds = group.getBounds()

      if (bounds.isValid()) {
        mapInstanceRef.current.fitBounds(bounds.pad(0.1))
        console.log(`🎯 Map fitted to ${validMarkers.length} markers`)
      }
    } else {
      console.warn("⚠️ No valid markers to fit map bounds")
    }

    console.log(`✅ Added ${validMarkers.length} valid markers to map`)
  }, [homes, onHomeSelect])

  if (isLoading) {
    return (
      <div className="w-full h-[600px] flex items-center justify-center bg-gray-100 rounded-lg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-600">Loading map...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-[600px] relative">
      <div ref={mapRef} className="w-full h-full rounded-lg" />

      {/* Legend */}
      <div className="absolute top-4 right-4 bg-white p-3 rounded-lg shadow-lg z-[1000]">
        <h4 className="text-sm font-medium mb-2">Units</h4>
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs">
            <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-[8px]">
              D
            </div>
            <span>Dallas</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-white font-bold text-[8px]">
              S
            </div>
            <span>San Antonio</span>
          </div>
        </div>
      </div>
    </div>
  )
}
