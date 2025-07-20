"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Home, RefreshCw, XCircle, ArrowLeft, Shield, Filter, Database } from "lucide-react"
import Link from "next/link"
import HomesMap from "@/components/homes-map"

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
  HomePhone?: string
  Xref?: string
  CaseManagerEmail?: string
  CaseManagerPhone?: string
  CaregiverEmail?: string
  LastSync?: string
}

interface HomesData {
  success: boolean
  homes?: HomeLocation[]
  count?: number
  error?: string
  message?: string
}

export default function HomesMapPage() {
  const [data, setData] = useState<HomesData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedUnit, setSelectedUnit] = useState<string>("ALL")
  const [mapKey, setMapKey] = useState(0) // Force re-render when unit changes

  const fetchHomes = async () => {
    setLoading(true)
    try {
      console.log("Fetching homes from API...")
      const response = await fetch("/api/homes-for-map")
      const result = await response.json()
      console.log("API Response:", result)
      setData(result)
    } catch (error) {
      console.error("Failed to fetch homes:", error)
      setData({
        success: false,
        error: "Failed to connect to API",
        message: error instanceof Error ? error.message : "Unknown error",
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

  // Handle unit change
  const handleUnitChange = (unit: string) => {
    setSelectedUnit(unit)
    setMapKey((prev) => prev + 1) // Force map re-render
  }

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
              <Link href="/test-db">
                <Button variant="outline" size="sm">
                  <Database className="w-4 h-4 mr-2" />
                  Test DB
                </Button>
              </Link>
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
                      onClick={() => handleUnitChange("ALL")}
                    >
                      All Units
                    </Button>
                    {availableUnits.map((unit) => (
                      <Button
                        key={unit}
                        variant={selectedUnit === unit ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleUnitChange(unit)}
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

            {/* Debug Information */}
            {data && !loading && (
              <div className="mb-4 p-3 bg-gray-50 rounded-md text-sm">
                <strong>Debug Info:</strong>
                {data.success ? (
                  <span className="text-green-600"> ✅ Query successful - Found {data.count} homes</span>
                ) : (
                  <span className="text-red-600"> ❌ Query failed - {data.error}</span>
                )}
                {data.message && <div className="text-gray-600 mt-1">Details: {data.message}</div>}
              </div>
            )}

            {data && !data.success && (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Error:</strong> {data.error}
                  {data.message && <div className="mt-2 text-sm">{data.message}</div>}
                </AlertDescription>
              </Alert>
            )}

            {data && data.success && data.count === 0 && (
              <Alert>
                <Home className="h-4 w-4" />
                <AlertDescription>
                  <strong>No homes found with coordinates.</strong> This could mean:
                  <ul className="mt-2 ml-4 list-disc text-sm">
                    <li>No homes have Latitude/Longitude values in the database</li>
                    <li>All coordinate values are NULL or 0</li>
                    <li>Database connection issue</li>
                  </ul>
                  <div className="mt-2">
                    <Link href="/test-db">
                      <Button variant="outline" size="sm">
                        <Database className="w-4 h-4 mr-2" />
                        Test Database Connection
                      </Button>
                    </Link>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {data && data.success && filteredHomes.length > 0 && <HomesMap key={mapKey} homes={filteredHomes} />}

            {data && data.success && data.count! > 0 && filteredHomes.length === 0 && selectedUnit !== "ALL" && (
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
