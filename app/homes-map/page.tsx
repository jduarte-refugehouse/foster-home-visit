"use client"

import { useEffect, useState } from "react"
import dynamic from "next/dynamic"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Home, RefreshCw, XCircle, ArrowLeft, Shield, Filter } from "lucide-react"
import Link from "next/link"

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

interface HomesData {
  success: boolean
  homes?: HomeLocation[]
  count?: number
  error?: string
}

const Map = dynamic(() => import("@/components/homes-map"), {
  ssr: false,
  loading: () => (
    <div className="h-[600px] w-full bg-gray-200 animate-pulse flex items-center justify-center rounded-md">
      <p className="text-gray-500">Loading map...</p>
    </div>
  ),
})

export default function HomesMapPage() {
  const [data, setData] = useState<HomesData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedUnit, setSelectedUnit] = useState<string>("ALL")

  const fetchHomes = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/homes-for-map")
      const result = await response.json()
      setData(result)
    } catch (error) {
      setData({
        success: false,
        error: "Failed to connect to API",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchHomes()
  }, [])

  // Filter homes based on selected unit
  const filteredHomes =
    data?.homes?.filter((home) => {
      if (selectedUnit === "ALL") return true
      return home.Unit === selectedUnit
    }) || []

  // Get unique units for the filter buttons
  const availableUnits = data?.homes ? [...new Set(data.homes.map((home) => home.Unit))].filter(Boolean) : []

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <Shield className="w-8 h-8 text-blue-600" />
              <span className="text-xl font-bold text-gray-900">Family Visits Pro</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/">
                <Button variant="ghost">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Home
                </Button>
              </Link>
              <Button onClick={fetchHomes} disabled={loading}>
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                {loading ? "Loading..." : "Refresh"}
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle className="flex items-center">
                  <Home className="w-5 h-5 mr-2" />
                  Active Homes Map
                </CardTitle>
                <CardDescription>
                  {loading
                    ? "Loading homes..."
                    : `Showing ${filteredHomes.length} of ${data?.count || 0} homes${
                        selectedUnit !== "ALL" ? ` (${selectedUnit} unit)` : ""
                      }`}
                </CardDescription>
              </div>

              {/* Unit Filter Buttons */}
              {availableUnits.length > 0 && (
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-gray-500" />
                  <div className="flex gap-1">
                    <Button
                      variant={selectedUnit === "ALL" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedUnit("ALL")}
                    >
                      All Units
                    </Button>
                    {availableUnits.map((unit) => (
                      <Button
                        key={unit}
                        variant={selectedUnit === unit ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedUnit(unit)}
                      >
                        {unit}
                        <Badge variant="secondary" className="ml-1">
                          {data?.homes?.filter((h) => h.Unit === unit).length}
                        </Badge>
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {loading && (
              <div className="h-[600px] w-full bg-gray-100 rounded-md flex items-center justify-center">
                <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
              </div>
            )}
            {data && !data.success && (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Error:</strong> {data.error}
                </AlertDescription>
              </Alert>
            )}
            {data && data.success && filteredHomes.length > 0 && <Map homes={filteredHomes} />}
            {data && data.success && filteredHomes.length === 0 && selectedUnit !== "ALL" && (
              <div className="h-[600px] w-full bg-gray-100 rounded-md flex items-center justify-center">
                <div className="text-center">
                  <Home className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No homes found for {selectedUnit} unit</h3>
                  <p className="text-gray-500">Try selecting a different unit or "All Units"</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
