"use client"

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"

// Fix for default marker icon issue with webpack
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png"
import markerIcon from "leaflet/dist/images/marker-icon.png"
import markerShadow from "leaflet/dist/images/marker-shadow.png"

// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon.src,
  iconRetinaUrl: markerIcon2x.src,
  shadowUrl: markerShadow.src,
})

interface HomeLocation {
  Guid: string
  HomeName: string
  Latitude: number
  Longitude: number
}

interface MapProps {
  homes: HomeLocation[]
}

export default function HomesMap({ homes }: MapProps) {
  // Default center to Texas
  const defaultCenter: [number, number] = [31.9686, -99.9018]
  const defaultZoom = 6

  return (
    <MapContainer
      center={defaultCenter}
      zoom={defaultZoom}
      scrollWheelZoom={true}
      style={{ height: "600px", width: "100%" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {homes.map((home) => (
        <Marker key={home.Guid} position={[home.Latitude, home.Longitude]}>
          <Popup>{home.HomeName}</Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}
