"use client"

import { useEffect, useRef } from "react"
import L from "leaflet"
import "leaflet/dist/leaflet.css"

// Fix for default markers in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
})

interface HomeData {
  id: string
  name: string
  address: string
  City: string
  State: string
  zipCode: string
  Unit: string
  latitude: number
  longitude: number
  phoneNumber?: string
  email?: string
  contactPersonName?: string
  contactPhone?: string
}

interface HomesMapProps {
  homes: HomeData[]
}

export default function HomesMap({ homes }: HomesMapProps) {
  const mapRef = useRef<L.Map | null>(null)
  const mapContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!mapContainerRef.current || homes.length === 0) return

    // Initialize map
    if (!mapRef.current) {
      mapRef.current = L.map(mapContainerRef.current).setView([32.7767, -96.797], 7) // Texas center

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(mapRef.current)
    }

    // Clear existing markers
    mapRef.current.eachLayer((layer) => {
      if (layer instanceof L.Marker) {
        mapRef.current!.removeLayer(layer)
      }
    })

    // Create custom icons for different units
    const dalIcon = L.divIcon({
      html: '<div style="background-color: #2563eb; color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 12px; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">D</div>',
      className: "custom-div-icon",
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    })

    const sanIcon = L.divIcon({
      html: '<div style="background-color: #dc2626; color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 12px; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">S</div>',
      className: "custom-div-icon",
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    })

    // Add markers for each home
    const markers: L.Marker[] = []
    homes.forEach((home) => {
      const icon = home.Unit === "DAL" ? dalIcon : sanIcon

      // Format city and state display
      const cityState =
        home.City && home.State ? `${home.City}, ${home.State}` : home.City || home.State || "Location not specified"

      const marker = L.marker([home.latitude, home.longitude], { icon })
        .bindPopup(`
          <div class="p-3 min-w-[250px]">
            <h3 class="font-bold text-lg mb-2">${home.name}</h3>
            <div class="space-y-2 text-sm">
              <p><strong>Address:</strong> ${home.address}</p>
              <p><strong>City:</strong> ${cityState} ${home.zipCode || ""}</p>
              <p><strong>Unit:</strong> <span class="inline-block px-2 py-1 text-xs font-semibold rounded ${home.Unit === "DAL" ? "bg-blue-100 text-blue-800" : "bg-red-100 text-red-800"}">${home.Unit}</span></p>
              ${home.phoneNumber ? `<p><strong>Phone:</strong> ${home.phoneNumber}</p>` : ""}
              ${home.contactPersonName ? `<p><strong>Contact:</strong> ${home.contactPersonName}</p>` : ""}
              ${home.contactPhone ? `<p><strong>Contact Phone:</strong> ${home.contactPhone}</p>` : ""}
              ${home.email ? `<p><strong>Email:</strong> ${home.email}</p>` : ""}
              <p class="text-xs text-gray-500 mt-2">Coordinates: ${home.latitude.toFixed(6)}, ${home.longitude.toFixed(6)}</p>
            </div>
          </div>
        `)
        .addTo(mapRef.current!)

      markers.push(marker)
    })

    // Fit map to show all markers
    if (markers.length > 0) {
      const group = new L.featureGroup(markers)
      mapRef.current.fitBounds(group.getBounds().pad(0.1))
    }

    // Cleanup function
    return () => {
      // Don't destroy the map, just clear markers
    }
  }, [homes])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [])

  return <div ref={mapContainerRef} className="w-full h-full" />
}
