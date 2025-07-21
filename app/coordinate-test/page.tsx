"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { RefreshCw, MapPin, CheckCircle, XCircle } from "lucide-react"

interface CoordinateTestResult {
  success: boolean
  message: string
  count: number
  sample: Array<{
    id: string
    name: string
    address: string
    City: string
    State: string
    zipCode: string
    Unit: string
    latitude: number
    longitude: number
    phoneNumber: string
    contactPersonName: string
    email: string
    contactPhone: string
    lastSync: string
  }>
  error?: string
  details?: string
}

export default function CoordinateTestPage() {
  const [result, setResult] = useState<CoordinateTestResult | null>(null)
  const [loading, setLoading] = useState(false)

  const runTest = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/test-coordinates")
      const data = await response.json()
      setResult(data)
    } catch (error) {
      setResult({
        success: false,
        message: "Network error occurred",
        count: 0,
        sample: [],
        error: error instanceof Error ? error.message : "Unknown error",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    runTest()
  }, [])

  const formatCoordinates = (lat: number, lng: number) => {
    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`
  }

  const formatLastSync = (lastSync: string) => {
    if (!lastSync) return "Never"
    try {
      const date = new Date(lastSync)
      return date.toLocaleDateString() + " " + date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    } catch {
      return "Invalid date"
    }
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Coordinate Access Test</h1>
        <Button onClick={runTest} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Run Test
        </Button>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {result?.success ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : (
              <XCircle className="h-5 w-5 text-red-600" />
            )}
            Test Results
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading && (
            <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
              <p>Testing coordinate access...</p>
            </div>
          )}

          {!loading && result && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Badge variant={result.success ? "default" : "destructive"}>
                  {result.success ? "SUCCESS" : "FAILED"}
                </Badge>
                <span className="text-sm text-gray-600">{result.message}</span>
              </div>

              {result.success && (
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-green-800">
                    ✅ Found <strong>{result.count}</strong> homes with valid coordinates
                  </p>
                </div>
              )}

              {!result.success && (
                <div className="bg-red-50 p-4 rounded-lg">
                  <p className="text-red-800">❌ {result.error || result.details}</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {result?.success && result.sample && result.sample.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Sample Data ({result.sample.length} homes)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Home Name</th>
                    <th className="text-left p-2">Address</th>
                    <th className="text-left p-2">Unit</th>
                    <th className="text-left p-2">Coordinates</th>
                    <th className="text-left p-2">Contact</th>
                    <th className="text-left p-2">Last Sync</th>
                  </tr>
                </thead>
                <tbody>
                  {result.sample.map((home, index) => (
                    <tr key={home.id || index} className="border-b hover:bg-gray-50">
                      <td className="p-2 font-medium">{home.name}</td>
                      <td className="p-2">
                        <div>{home.address}</div>
                        <div className="text-xs text-gray-500">
                          {home.City}, {home.State} {home.zipCode}
                        </div>
                      </td>
                      <td className="p-2">
                        <Badge variant="outline">{home.Unit}</Badge>
                      </td>
                      <td className="p-2 font-mono text-xs">{formatCoordinates(home.latitude, home.longitude)}</td>
                      <td className="p-2">
                        <div className="text-sm">{home.contactPersonName}</div>
                        {home.email && <div className="text-xs text-gray-500">{home.email}</div>}
                      </td>
                      <td className="p-2 text-xs">{formatLastSync(home.lastSync)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
