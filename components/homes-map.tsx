"use client"

import { useEffect, useRef, useState } from "react"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"

// Fix for default markers in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
})

interface Home {
  id: number
  name: string
  address: string
  latitude: number
  longitude: number
  phone?: string
  email?: string
}

interface HomesMapProps {
  homes: Home[]
}

export default function HomesMap({ homes }: HomesMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!mapRef.current) return

    // Initialize map
    const map = L.map(mapRef.current).setView([39.8283, -98.5795], 4) // Center of US

    // Add OpenStreetMap tiles
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
    }).addTo(map)

    mapInstanceRef.current = map
    setIsLoading(false)

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    if (!mapInstanceRef.current || !homes.length) return

    // Clear existing markers
    mapInstanceRef.current.eachLayer((layer) => {
      if (layer instanceof L.Marker) {
        mapInstanceRef.current?.removeLayer(layer)
      }
    })

    // Add markers for each home
    const markers: L.Marker[] = []
    homes.forEach((home) => {
      if (home.latitude && home.longitude) {
        const marker = L.marker([home.latitude, home.longitude])
          .bindPopup(`
            <div>
              <h3>${home.name}</h3>
              <p>${home.address}</p>
              ${home.phone ? `<p>Phone: ${home.phone}</p>` : ""}
              ${home.email ? `<p>Email: ${home.email}</p>` : ""}
            </div>
          `)
          .addTo(mapInstanceRef.current!)

        markers.push(marker)
      }
    })

    // Fit map to show all markers
    if (markers.length > 0) {
      const group = new L.FeatureGroup(markers)
      mapInstanceRef.current.fitBounds(group.getBounds().pad(0.1))
    }
  }, [homes])

  if (isLoading) {
    return (
      <div className="w-full h-96 flex items-center justify-center bg-gray-100 rounded-lg">
        <div className="text-gray-600">Loading map...</div>
      </div>
    )
  }

  if (error) return <div className="text-center py-8 text-red-500">Error: {error}</div>
  if (homes.length === 0) return <div className="text-center py-8">No homes data available.</div>

  return (
    <Card className="w-full h-[600px] flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-2xl font-bold">Homes Map</CardTitle>
        <Button onClick={() => {}} disabled={isLoading} size="sm">
          <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          <span className="sr-only">Refresh Map</span>
        </Button>
      </CardHeader>
      <CardContent className="flex-1 p-0">
        <div ref={mapRef} className="w-full h-full" />
      </CardContent>
    </Card>
  )
}
