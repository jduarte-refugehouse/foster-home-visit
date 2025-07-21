"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RefreshCw, ArrowLeft, MapPin } from "lucide-react"
import Link from "next/link"
import dynamic from "next/dynamic"

// Dynamically import the map component to avoid SSR issues
const HomesMap = dynamic(() => import("@/components/homes-map"), {
  ssr: false,
  loading: () => (
    <div className="h-96 bg-gray-100 animate-pulse rounded-lg flex items-center justify-center">Loading map...</div>
  ),
})

interface HomeData {
  id: string
  name: string
  address: string
  city: string
  state: string
  zipCode: string
  Unit: string
  latitude: number
  longitude: number
  phoneNumber?: string
  email?: string
  contactPersonName?: string
}

interface ApiResponse {
  success: boolean
  homes: HomeData[]
  total: number
  unitSummary: Record<string, number>
  filter: string
  error?: string
}

export default function HomesMapPage() {
  const [data, setData] = useState<ApiResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [unitFilter, setUnitFilter] = useState<string>("ALL")

  const fetchHomes = async (unit = "ALL") => {
    setLoading(true)
    try {
      console.log(`🗺️ Fetching homes for map with unit filter: ${unit}`)
      const url = unit === "ALL" ? "/api/homes-for-map" : `/api/homes-for-map?unit=${unit}`
      const response = await fetch(url)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      console.log("✅ Map data received:", result)
      setData(result)
    } catch (error: any) {
      console.error("❌ Error fetching homes for map:", error)
      setData({
        success: false,
        homes: [],
        total: 0,
        unitSummary: {},
        filter: unit,
        error: error.message,
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchHomes(unitFilter)
  }, [unitFilter])

  const handleUnitChange = (value: string) => {
    setUnitFilter(value)
  }

  const handleRefresh = () => {
    fetchHomes(unitFilter)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">Homes Map</h1>
          </div>

          <div className="flex items-center gap-4">
            {data && (
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-sm">
                  {data.total} homes found
                </Badge>
                {data.unitSummary && Object.keys(data.unitSummary).length > 0 && (
                  <div className="flex gap-1">
                    {Object.entries(data.unitSummary).map(([unit, count]) => (
                      <Badge key={unit} variant="secondary" className="text-xs">
                        {unit}: {count}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            )}

            <Select value={unitFilter} onValueChange={handleUnitChange}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter by unit" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Units</SelectItem>
                <SelectItem value="DAL">Dallas (DAL)</SelectItem>
                <SelectItem value="SAN">San Antonio (SAN)</SelectItem>
              </SelectContent>
            </Select>

            <Button onClick={handleRefresh} disabled={loading} size="sm">
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Foster Homes Map
              {data?.filter && data.filter !== "ALL" && (
                <Badge variant="outline">
                  Filtered by: {data.filter === "DAL" ? "Dallas" : data.filter === "SAN" ? "San Antonio" : data.filter}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading && (
              <div className="text-center py-8">
                <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
                <p className="text-gray-600">Loading map data...</p>
              </div>
            )}

            {!loading && data && !data.success && (
              <div className="text-center py-8">
                <div className="text-red-600 mb-4">
                  <strong>Error:</strong> {data.error}
                </div>
                <Button onClick={handleRefresh}>Try Again</Button>
              </div>
            )}

            {!loading && data && data.success && data.homes.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-600 mb-4">
                  No homes found{data.filter !== "ALL" ? ` for ${data.filter}` : ""}.
                </p>
                <Button onClick={handleRefresh}>Refresh</Button>
              </div>
            )}

            {!loading && data && data.success && data.homes.length > 0 && (
              <div className="space-y-4">
                {/* Map Legend */}
                <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium">Legend:</span>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-blue-600 rounded-full"></div>
                    <span className="text-sm">Dallas (DAL)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-red-600 rounded-full"></div>
                    <span className="text-sm">San Antonio (SAN)</span>
                  </div>
                </div>

                {/* Map Component */}
                <div className="h-96 rounded-lg overflow-hidden border">
                  <HomesMap homes={data.homes} />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
