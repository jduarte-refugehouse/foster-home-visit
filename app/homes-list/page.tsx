"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { RefreshCw, ArrowLeft, MapPin, Phone, Mail } from "lucide-react"
import Link from "next/link"

interface HomeData {
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
}

interface ApiResponse {
  success: boolean
  count: number
  homes: HomeData[]
  error?: string
}

export default function HomesListPage() {
  const [data, setData] = useState<ApiResponse | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchHomes = async () => {
    setLoading(true)
    try {
      console.log("🏠 Fetching homes data...")
      const response = await fetch("/api/homes-list")
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const result = await response.json()
      console.log("✅ Homes data received:", result)
      setData(result)
    } catch (error: any) {
      console.error("❌ Error fetching homes:", error)
      setData({
        success: false,
        count: 0,
        homes: [],
        error: error.message,
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchHomes()
  }, [])

  const formatLastSync = (lastSync: string) => {
    if (!lastSync) return "Never"
    try {
      const date = new Date(lastSync)
      return date.toLocaleDateString() + " " + date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    } catch {
      return "Invalid date"
    }
  }

  const hasValidCoordinates = (lat: number, lng: number) => {
    return lat && lng && lat !== 0 && lng !== 0
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
            <h1 className="text-3xl font-bold text-gray-900">Homes List</h1>
          </div>
          <div className="flex items-center gap-4">
            {data && (
              <Badge variant="outline" className="text-sm">
                {data.count} homes found
              </Badge>
            )}
            <Button onClick={fetchHomes} disabled={loading} size="sm">
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Refresh Data
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Active Homes from SyncActiveHomes</CardTitle>
          </CardHeader>
          <CardContent>
            {loading && (
              <div className="text-center py-8">
                <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
                <p className="text-gray-600">Loading homes data...</p>
              </div>
            )}

            {!loading && data && !data.success && (
              <div className="text-center py-8">
                <div className="text-red-600 mb-4">
                  <strong>Error:</strong> {data.error}
                </div>
                <Button onClick={fetchHomes}>Try Again</Button>
              </div>
            )}

            {!loading && data && data.success && data.homes.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-600 mb-4">No homes data available in SyncActiveHomes table.</p>
                <Button onClick={fetchHomes}>Refresh</Button>
              </div>
            )}

            {!loading && data && data.success && data.homes.length > 0 && (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Home Name</TableHead>
                      <TableHead>Address</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Case Manager</TableHead>
                      <TableHead>Unit</TableHead>
                      <TableHead>Map Status</TableHead>
                      <TableHead>Last Sync</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.homes.map((home, index) => (
                      <TableRow key={home.id || index}>
                        <TableCell className="font-medium">
                          <div>
                            <div className="font-semibold">{home.name}</div>
                            {home.id && <div className="text-xs text-gray-500">ID: {home.id}</div>}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-start gap-1">
                            <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                            <div className="text-sm">
                              <div>{home.address}</div>
                              <div className="text-gray-600">
                                {home.City}, {home.State} {home.zipCode}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {home.phoneNumber && (
                            <div className="flex items-center gap-1 text-sm">
                              <Phone className="h-3 w-3 text-gray-400" />
                              {home.phoneNumber}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div className="font-medium">{home.contactPersonName}</div>
                            {home.email && (
                              <div className="flex items-center gap-1 text-xs text-gray-600">
                                <Mail className="h-3 w-3" />
                                {home.email}
                              </div>
                            )}
                            {home.contactPhone && (
                              <div className="flex items-center gap-1 text-xs text-gray-600">
                                <Phone className="h-3 w-3" />
                                {home.contactPhone}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {home.Unit || "N/A"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {hasValidCoordinates(home.latitude, home.longitude) ? (
                            <Badge variant="default" className="text-xs bg-green-100 text-green-800">
                              ✓ On Map
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-800">
                              No Location
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="text-xs text-gray-600">{formatLastSync(home.lastSync)}</div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
