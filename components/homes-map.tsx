"use client"

import { useState, useEffect } from "react"
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet"
import "leaflet/dist/leaflet.css"
import L from "leaflet"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"

// Fix for default icon issue with Webpack
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
})

interface HomeData {
  id: number
  address: string
  city: string
  state: string
  zip: string
  latitude: number
  longitude: number
}

export default function HomesMap() {
  const [homes, setHomes] = useState<HomeData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchHomes = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch("/api/homes-for-map")
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      if (data.success) {
        setHomes(data.homes)
      } else {
        setError(data.error || "Failed to fetch homes data.")
      }
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchHomes()
  }, [])

  if (loading) return <div className="text-center py-8">Loading map data...</div>
  if (error) return <div className="text-center py-8 text-red-500">Error: {error}</div>
  if (homes.length === 0) return <div className="text-center py-8">No homes data available.</div>

  // Calculate center of all homes for initial map view
  const centerLat = homes.reduce((sum, h) => sum + h.latitude, 0) / homes.length
  const centerLng = homes.reduce((sum, h) => sum + h.longitude, 0) / homes.length
  const initialCenter: [number, number] = [centerLat, centerLng]

  return (
    <Card className="w-full h-[600px] flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-2xl font-bold">Homes Map</CardTitle>
        <Button onClick={fetchHomes} disabled={loading} size="sm">
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          <span className="sr-only">Refresh Map</span>
        </Button>
      </CardHeader>
      <CardContent className="flex-1 p-0">
        <MapContainer center={initialCenter} zoom={10} scrollWheelZoom={true} className="h-full w-full rounded-b-lg">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {homes.map((home) => (
            <Marker key={home.id} position={[home.latitude, home.longitude]}>
              <Popup>
                <strong>{home.address}</strong>
                <br />
                {home.city}, {home.state} {home.zip}
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </CardContent>
    </Card>
  )
}
