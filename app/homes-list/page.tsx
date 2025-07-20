"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { RefreshCw, CheckCircle, XCircle, ArrowLeft, Shield, MapPin } from "lucide-react"
import Link from "next/link"

interface Home {
  Guid: string
  HomeName: string
  Street: string
  City: string
  State: string
  Zip: string
  HomePhone: string
  CaseManager: string
  Unit: string
  Latitude?: number
  Longitude?: number
  Xref?: string
  CaseManagerEmail?: string
  CaseManagerPhone?: string
  CaregiverEmail?: string
  LastSync?: string
}

interface HomesData {
  success: boolean
  homes?: Home[]
  count?: number
  error?: string
  message?: string
}

export default function HomesListPage() {
  const [data, setData] = useState<HomesData | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchHomes = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/homes-list")
      const result = await response.json()
      console.log("Homes list API response:", result)
      setData(result)
    } catch (error) {
      setData({
        success: false,
        error: "Failed to connect to the API.",
        message: error instanceof Error ? error.message : "An unknown error occurred.",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchHomes()
  }, [])

  const formatCoordinate = (coord: number | undefined | null): string => {
    if (coord === null || coord === undefined) return "N/A"
    return coord.toFixed(6)
  }

  const hasValidCoordinates = (home: Home): boolean => {
    return home.Latitude != null && home.Longitude != null && home.Latitude !== 0 && home.Longitude !== 0
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-10">
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
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Active Homes List</h1>
            <p className="text-gray-600">Displaying data with coordinates from the SyncActiveHomes table.</p>
          </div>

          {loading && (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <div className="text-center">
                  <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
                  <p className="text-gray-600">Loading homes data...</p>
                </div>
              </CardContent>
            </Card>
          )}

          {data && !loading && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center">
                      {data.success ? (
                        <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-500 mr-2" />
                      )}
                      Query Status
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant={data.success ? "default" : "destructive"}>
                        {data.success ? `${data.count || 0} records found` : "Failed"}
                      </Badge>
                      {data.success && data.homes && (
                        <Badge variant="outline">
                          {data.homes.filter(hasValidCoordinates).length} with coordinates
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                {data.error && (
                  <CardContent>
                    <Alert variant="destructive">
                      <XCircle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Error:</strong> {data.error}
                        {data.message && <p className="text-xs mt-2">{data.message}</p>}
                      </AlertDescription>
                    </Alert>
                  </CardContent>
                )}
              </Card>

              {data.success && data.homes && data.homes.length > 0 && (
                <div className="space-y-4">
                  {data.homes.map((home) => (
                    <Card
                      key={home.Guid}
                      className={hasValidCoordinates(home) ? "border-green-200" : "border-gray-200"}
                    >
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="flex items-center gap-2">
                              {home.HomeName}
                              {hasValidCoordinates(home) && (
                                <Badge variant="outline" className="text-green-700 border-green-300">
                                  <MapPin className="w-3 h-3 mr-1" />
                                  Has Coordinates
                                </Badge>
                              )}
                            </CardTitle>
                            <CardDescription>
                              Case Manager: {home.CaseManager || "N/A"} | Unit: {home.Unit || "N/A"}
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <div className="text-sm">
                              <strong>Address:</strong>
                              <br />
                              {home.Street}
                              <br />
                              {home.City}, {home.State} {home.Zip}
                            </div>
                            <div className="text-sm">
                              <strong>Phone:</strong> {home.HomePhone || "N/A"}
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div className="text-sm">
                              <strong>Coordinates:</strong>
                              <br />
                              <span className="font-mono text-xs">
                                Lat: {formatCoordinate(home.Latitude)}
                                <br />
                                Lng: {formatCoordinate(home.Longitude)}
                              </span>
                            </div>
                            {hasValidCoordinates(home) && (
                              <Badge variant="outline" className="text-green-700">
                                ✓ Map Ready
                              </Badge>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
