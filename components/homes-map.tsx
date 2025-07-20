"use client"

import { useEffect, useRef } from "react"
import "leaflet/dist/leaflet.css"

interface HomeLocation {
  Guid: string
  HomeName: string
  Street: string
  City: string
  State: string
  Zip: string
  Unit: string
  CaseManager: string
  Latitude: number
  Longitude: number
}

interface MapProps {
  homes: HomeLocation[]
}

export default function HomesMap({ homes }: MapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return

    const initializeMap = async () => {
      try {
        // Import Leaflet dynamically
        const L = (await import("leaflet")).default

        // Fix marker icons
        const iconRetinaUrl = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png"
        const iconUrl = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png"
        const shadowUrl = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png"

        delete (L.Icon.Default.prototype as any)._getIconUrl
        L.Icon.Default.mergeOptions({
          iconRetinaUrl,
          iconUrl,
          shadowUrl,
        })

        // Calculate center and zoom
        const calculateCenter = (): [number, number] => {
          if (homes.length === 0) return [31.9686, -99.9018]
          const avgLat = homes.reduce((sum, home) => sum + home.Latitude, 0) / homes.length
          const avgLon = homes.reduce((sum, home) => sum + home.Longitude, 0) / homes.length
          return [avgLat, avgLon]
        }

        const calculateZoom = (): number => {
          if (homes.length === 0) return 6
          const lats = homes.map((h) => h.Latitude)
          const lons = homes.map((h) => h.Longitude)
          const latSpread = Math.max(...lats) - Math.min(...lats)
          const lonSpread = Math.max(...lons) - Math.min(...lons)
          const maxSpread = Math.max(latSpread, lonSpread)
          if (maxSpread > 5) return 6
          if (maxSpread > 2) return 8
          if (maxSpread > 0.5) return 10
          return 12
        }

        const center = calculateCenter()
        const zoom = calculateZoom()

        // Create map
        const map = L.map(mapRef.current).setView(center, zoom)

        // Add tile layer
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        }).addTo(map)

        // Add markers
        homes.forEach((home) => {
          const marker = L.marker([home.Latitude, home.Longitude]).addTo(map)

          const popupContent = `
            <div style="min-width: 200px;">
              <h3 style="font-weight: 600; font-size: 1.125rem; margin-bottom: 0.5rem;">${home.HomeName}</h3>
              <div style="font-size: 0.875rem; line-height: 1.25rem;">
                <p style="margin-bottom: 0.25rem;">
                  <strong>Address:</strong><br/>
                  ${home.Street}<br/>
                  ${home.City}, ${home.State} ${home.Zip}
                </p>
                <p style="margin-bottom: 0.25rem;">
                  <strong>Unit:</strong> ${home.Unit}
                </p>
                <p style="margin-bottom: 0.25rem;">
                  <strong>Case Manager:</strong> ${home.CaseManager || "N/A"}
                </p>
              </div>
            </div>
          `

          marker.bindPopup(popupContent)
        })

        mapInstanceRef.current = map
      } catch (error) {
        console.error("Failed to initialize map:", error)
      }
    }

    initializeMap()

    // Cleanup function
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [homes])

  return <div ref={mapRef} className="h-[600px] w-full rounded-md" style={{ height: "600px", width: "100%" }} />
}
