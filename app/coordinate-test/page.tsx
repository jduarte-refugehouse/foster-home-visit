"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"

interface HomeCoordinateData {
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

export default function CoordinateTestPage() {
  const [homes, setHomes] = useState<HomeCoordinateData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchHomesWithCoordinates = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch("/api/test-coordinates")
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
    fetchHomesWithCoordinates()
  }, [])

  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-2xl font-bold">Coordinate Access Test</CardTitle>
          <Button onClick={fetchHomesWithCoordinates} disabled={loading} size="sm">
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh Data
          </Button>
        </CardHeader>
        <CardContent>
          {loading && <div className="text-center py-8">Loading coordinate data...</div>}
          {error && <div className="text-center py-8 text-red-500">Error: {error}</div>}
          {!loading && !error && homes.length === 0 && (
            <div className="text-center py-8">No homes with coordinates found.</div>
          )}
          {!loading && !error && homes.length > 0 && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Home Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Address
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Latitude
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Longitude
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {homes.map((home) => (
                    <tr key={home.Guid}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{home.HomeName}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {home.Street}, {home.City}, {home.State} {home.Zip}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {home.Latitude?.toFixed(6) || "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {home.Longitude?.toFixed(6) || "N/A"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
