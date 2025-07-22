"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, Calendar } from "lucide-react"

interface Home {
  id: number
  name: string
  address: string
  city: string
  state: string
  latitude: number
  longitude: number
  status: "active" | "pending" | "inactive"
  capacity: number
  current_residents: number
  last_visit: string
  next_visit: string
}

export function HomesMap() {
  const [homes, setHomes] = useState<Home[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedHome, setSelectedHome] = useState<Home | null>(null)

  useEffect(() => {
    fetchHomes()
  }, [])

  const fetchHomes = async () => {
    try {
      const response = await fetch("/api/homes-for-map")
      if (response.ok) {
        const data = await response.json()
        setHomes(data)
      }
    } catch (error) {
      console.error("Error fetching homes:", error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500"
      case "pending":
        return "bg-yellow-500"
      case "inactive":
        return "bg-gray-400"
      default:
        return "bg-gray-400"
    }
  }

  if (loading) {
    return (
      <div className="h-96 bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading map...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative h-96 bg-gray-100 rounded-lg overflow-hidden">
      {/* Placeholder map background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-100 to-green-100">
        <div className="absolute inset-0 opacity-20">
          <svg className="w-full h-full" viewBox="0 0 400 300">
            {/* Simple map-like background */}
            <path d="M50 50 Q100 30 150 50 T250 50 Q300 70 350 50" stroke="#3b82f6" strokeWidth="2" fill="none" />
            <path d="M30 100 Q80 80 130 100 T230 100 Q280 120 330 100" stroke="#3b82f6" strokeWidth="2" fill="none" />
            <path d="M70 150 Q120 130 170 150 T270 150 Q320 170 370 150" stroke="#3b82f6" strokeWidth="2" fill="none" />
            <path d="M40 200 Q90 180 140 200 T240 200 Q290 220 340 200" stroke="#3b82f6" strokeWidth="2" fill="none" />
          </svg>
        </div>
      </div>

      {/* Home markers */}
      {homes.map((home, index) => (
        <div
          key={home.id}
          className="absolute cursor-pointer transform -translate-x-1/2 -translate-y-1/2"
          style={{
            left: `${20 + (index % 8) * 10}%`,
            top: `${20 + Math.floor(index / 8) * 15}%`,
          }}
          onClick={() => setSelectedHome(home)}
        >
          <div
            className={`w-4 h-4 rounded-full ${getStatusColor(home.status)} border-2 border-white shadow-lg hover:scale-125 transition-transform`}
          ></div>
        </div>
      ))}

      {/* Selected home popup */}
      {selectedHome && (
        <div className="absolute bottom-4 left-4 right-4 z-10">
          <Card className="shadow-lg">
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-lg">{selectedHome.name}</h3>
                <button onClick={() => setSelectedHome(null)} className="text-gray-400 hover:text-gray-600">
                  ×
                </button>
              </div>
              <p className="text-sm text-gray-600 mb-3">
                {selectedHome.address}, {selectedHome.city}, {selectedHome.state}
              </p>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  <span>
                    {selectedHome.current_residents}/{selectedHome.capacity}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>Next: {new Date(selectedHome.next_visit).toLocaleDateString()}</span>
                </div>
                <Badge className={`${getStatusColor(selectedHome.status)} text-white`}>{selectedHome.status}</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Map attribution */}
      <div className="absolute bottom-2 right-2 text-xs text-gray-500 bg-white px-2 py-1 rounded">
        Interactive Map View
      </div>
    </div>
  )
}
