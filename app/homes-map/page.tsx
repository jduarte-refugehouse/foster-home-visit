"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"
import HomesMapComponent from "@/components/homes-map" // Renamed to avoid conflict

interface HomeData {
  id: number
  address: string
  city: string
  state: string
  zip: string
  latitude: number
  longitude: number
}

export default function HomesMapPage() {
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

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="w-full h-[700px] flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-2xl font-bold">Homes Map</CardTitle>
          <Button onClick={fetchHomes} disabled={loading} size="sm">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            <span className="sr-only">Refresh Map</span>
          </Button>
        </CardHeader>
        <CardContent className="flex-1 p-0">
          {loading && <div className="text-center py-8">Loading map data...</div>}
          {error && <div className="text-center py-8 text-red-500">Error: {error}</div>}
          {!loading && !error && homes.length === 0 && <div className="text-center py-8">No homes data available.</div>}
          {!loading && !error && homes.length > 0 && <HomesMapComponent homes={homes} />}
        </CardContent>
      </Card>
    </div>
  )
}
