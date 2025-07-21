"use client"

import { useEffect, useRef } from "react"
import L from "leaflet"
import "leaflet/dist/leaflet.css"

// Fix for default markers in Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
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
}

interface HomesMapProps {
  homes: MapHome[]
}

export default function HomesMap({ homes }: HomesMapProps) {
  const mapRef = useRef<L.Map | null>(null)
  const mapContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!mapContainerRef.current) return

    // Initialize map
    if (!mapRef.current) {
      mapRef.current = L.map(mapContainerRef.current).setView([32.7767, -96.797], 7) // Texas center

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
      }).addTo(mapRef.current)
    }

    const map = mapRef.current

    // Clear existing markers
    map.eachLayer((layer) => {
      if (layer instanceof L.Marker) {
        map.removeLayer(layer)
      }
    })

    if (homes.length === 0) return

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

      const marker = L.marker([home.latitude, home.longitude], { icon })
        .bindPopup(`
          <div style="min-width: 250px;">
            <h3 style="margin: 0 0 10px 0; font-size: 16px; font-weight: bold; color: #1f2937;">
              ${home.name}
            </h3>
            <div style="space-y: 8px;">
              <p style="margin: 4px 0; color: #4b5563;">
                <strong>Address:</strong> ${home.address}
              </p>
              <p style="margin: 4px 0; color: #4b5563;">
                <strong>City:</strong> ${home.City || "N/A"}, ${home.State || "N/A"} ${home.zipCode}
              </p>
              <p style="margin: 4px 0;">
                <strong>Unit:</strong> 
                <span style="background-color: ${home.Unit === "DAL" ? "#dbeafe" : "#fecaca"}; color: ${home.Unit === "DAL" ? "#1d4ed8" : "#dc2626"}; padding: 2px 8px; border-radius: 12px; font-size: 12px; font-weight: bold;">
                  ${home.Unit}
                </span>
              </p>
              <p style="margin: 4px 0; color: #4b5563;">
                <strong>Phone:</strong> ${home.phoneNumber || "N/A"}
              </p>
              <p style="margin: 4px 0; color: #4b5563;">
                <strong>Contact:</strong> ${home.contactPersonName || "~unassigned~"}
              </p>
              <p style="margin: 4px 0; color: #4b5563;">
                <strong>Email:</strong> ${home.email || "N/A"}
              </p>
            </div>
          </div>
        `)
        .addTo(map)

      markers.push(marker)
    })

    // Fit map to show all markers
    if (markers.length > 0) {
      const group = new L.FeatureGroup(markers)
      map.fitBounds(group.getBounds().pad(0.1))
    }

    return () => {
      // Cleanup function
      markers.forEach((marker) => {
        map.removeLayer(marker)
      })
    }
  }, [homes])

  useEffect(() => {
    return () => {
      // Cleanup map on unmount
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [])

  return <div ref={mapContainerRef} className="w-full h-full rounded-lg" style={{ minHeight: "400px" }} />
}
