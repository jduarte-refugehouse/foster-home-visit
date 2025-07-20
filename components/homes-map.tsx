"use client"

import { useEffect, useState } from "react"

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
  const [mapComponents, setMapComponents] = useState<any>(null)

  useEffect(() => {
    // Dynamically import all Leaflet components on client side only
    const loadMapComponents = async () => {
      const L = await import("leaflet")
      const { MapContainer, TileLayer, Marker, Popup } = await import("react-leaflet")

      // Import CSS
      await import("leaflet/dist/leaflet.css")

      // Fix for default marker icon issue with webpack
      const markerIcon2x = await import("leaflet/dist/images/marker-icon-2x.png")
      const markerIcon = await import("leaflet/dist/images/marker-icon.png")
      const markerShadow = await import("leaflet/dist/images/marker-shadow.png")

      // @ts-ignore
      delete L.default.Icon.Default.prototype._getIconUrl
      L.default.Icon.Default.mergeOptions({
        iconUrl: markerIcon.default.src,
        iconRetinaUrl: markerIcon2x.default.src,
        shadowUrl: markerShadow.default.src,
      })

      setMapComponents({ MapContainer, TileLayer, Marker, Popup, L: L.default })
    }

    loadMapComponents()
  }, [])

  // Calculate the center point based on the homes
  const calculateCenter = (): [number, number] => {
    if (homes.length === 0) return [31.9686, -99.9018] // Default to Texas center

    const avgLat = homes.reduce((sum, home) => sum + home.Latitude, 0) / homes.length
    const avgLon = homes.reduce((sum, home) => sum + home.Longitude, 0) / homes.length

    return [avgLat, avgLon]
  }

  // Calculate appropriate zoom level based on the spread of homes
  const calculateZoom = (): number => {
    if (homes.length === 0) return 6

    const lats = homes.map((h) => h.Latitude)
    const lons = homes.map((h) => h.Longitude)

    const latSpread = Math.max(...lats) - Math.min(...lats)
    const lonSpread = Math.max(...lons) - Math.min(...lons)
    const maxSpread = Math.max(latSpread, lonSpread)

    // Rough zoom calculation based on coordinate spread
    if (maxSpread > 5) return 6 // State level
    if (maxSpread > 2) return 8 // Regional level
    if (maxSpread > 0.5) return 10 // City level
    return 12 // Neighborhood level
  }

  if (!mapComponents) {
    return (
      <div className="h-[600px] w-full bg-gray-200 animate-pulse flex items-center justify-center rounded-md">
        <p className="text-gray-500">Loading map components...</p>
      </div>
    )
  }

  const { MapContainer, TileLayer, Marker, Popup } = mapComponents
  const center = calculateCenter()
  const zoom = calculateZoom()

  return (
    <div className="h-[600px] w-full rounded-md overflow-hidden">
      <MapContainer center={center} zoom={zoom} scrollWheelZoom={true} style={{ height: "100%", width: "100%" }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {homes.map((home) => (
          <Marker key={home.Guid} position={[home.Latitude, home.Longitude]}>
            <Popup>
              <div className="min-w-[200px]">
                <h3 className="font-semibold text-lg mb-2">{home.HomeName}</h3>
                <div className="space-y-1 text-sm">
                  <p>
                    <strong>Address:</strong>
                    <br />
                    {home.Street}
                    <br />
                    {home.City}, {home.State} {home.Zip}
                  </p>
                  <p>
                    <strong>Unit:</strong> {home.Unit}
                  </p>
                  <p>
                    <strong>Case Manager:</strong> {home.CaseManager || "N/A"}
                  </p>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}
