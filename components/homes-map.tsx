"use client"

import { Card, CardContent } from "@/components/ui/card"
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet"
import "leaflet/dist/leaflet.css"
import L from "leaflet"
import { useEffect, useState } from "react"

// Fix for default icon issue with Leaflet and Webpack
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
})

interface HomeData {
  id: number
  address: string
  latitude: number
  longitude: number
  // Add other relevant home properties here
}

export function HomesMap({ homes }: { homes: HomeData[] }) {
  const [mapLoaded, setMapLoaded] = useState(false)

  useEffect(() => {
    setMapLoaded(true)
  }, [])

  if (!mapLoaded) {
    return (
      <Card className="w-full h-[500px] flex items-center justify-center">
        <CardContent>Loading Map...</CardContent>
      </Card>
    )
  }

  // Default center if no homes are provided or coordinates are invalid
  const defaultCenter: [number, number] = [34.052235, -118.243683] // Los Angeles coordinates
  const center: [number, number] =
    homes.length > 0 && homes[0].latitude && homes[0].longitude
      ? [homes[0].latitude, homes[0].longitude]
      : defaultCenter

  return (
    <Card className="w-full h-[500px]">
      <CardContent className="p-0 h-full">
        <MapContainer center={center} zoom={10} scrollWheelZoom={false} className="h-full w-full rounded-lg">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {homes.map(
            (home) =>
              home.latitude &&
              home.longitude && (
                <Marker key={home.id} position={[home.latitude, home.longitude]}>
                  <Popup>
                    <strong>{home.address}</strong>
                    <br />
                    {/* Add more home details here if available */}
                    Latitude: {home.latitude}
                    <br />
                    Longitude: {home.longitude}
                  </Popup>
                </Marker>
              ),
          )}
        </MapContainer>
      </CardContent>
    </Card>
  )
}
