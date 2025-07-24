"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { RefreshCw, MapPin, Phone, Mail } from "lucide-react"

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
    <div className="space-y-6 p-6 bg-gradient-to-br from-refuge-gray to-white min-h-screen">
      {/* Action Bar - Only refresh button and count */}
      <div className="flex items-center justify-end gap-4">
        {data && (
          <Badge
            variant="outline"
            className="text-sm border-refuge-light-purple text-refuge-purple bg-white/80 backdrop-blur-sm"
          >
            {data.count} homes found
          </Badge>
        )}
        <Button
          onClick={fetchHomes}
          disabled={loading}
          size="sm"
          className="bg-gradient-to-r from-refuge-purple to-refuge-magenta hover:from-refuge-purple/90 hover:to-refuge-magenta/90 text-white shadow-lg transition-all duration-200"
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh Data
        </Button>
      </div>

      <Card className="shadow-xl border-0 bg-white/95 backdrop-blur-sm">
        <CardHeader className="bg-gradient-to-r from-refuge-purple to-refuge-magenta text-white rounded-t-lg">
          <CardTitle className="text-xl font-semibold">Active Homes from SyncActiveHomes</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading && (
            <div className="text-center py-12 bg-gradient-to-br from-refuge-gray/30 to-white">
              <RefreshCw className="h-12 w-12 animate-spin text-refuge-purple mx-auto mb-4" />
              <p className="text-refuge-dark-blue font-medium">Loading homes data...</p>
            </div>
          )}

          {!loading && data && !data.success && (
            <div className="text-center py-12 bg-gradient-to-br from-red-50 to-white">
              <div className="text-red-600 mb-4 font-medium">
                <strong>Error:</strong> {data.error}
              </div>
              <Button
                onClick={fetchHomes}
                className="bg-gradient-to-r from-refuge-purple to-refuge-magenta hover:from-refuge-purple/90 hover:to-refuge-magenta/90 text-white"
              >
                Try Again
              </Button>
            </div>
          )}

          {!loading && data && data.success && data.homes.length === 0 && (
            <div className="text-center py-12 bg-gradient-to-br from-refuge-gray/30 to-white">
              <p className="text-refuge-dark-blue mb-4 font-medium">
                No homes data available in SyncActiveHomes table.
              </p>
              <Button
                onClick={fetchHomes}
                className="bg-gradient-to-r from-refuge-purple to-refuge-magenta hover:from-refuge-purple/90 hover:to-refuge-magenta/90 text-white"
              >
                Refresh
              </Button>
            </div>
          )}

          {!loading && data && data.success && data.homes.length > 0 && (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gradient-to-r from-refuge-light-purple/20 to-refuge-purple/10 border-b border-refuge-light-purple/30">
                    <TableHead className="font-semibold text-refuge-dark-blue">Home Name</TableHead>
                    <TableHead className="font-semibold text-refuge-dark-blue">Address</TableHead>
                    <TableHead className="font-semibold text-refuge-dark-blue">Phone</TableHead>
                    <TableHead className="font-semibold text-refuge-dark-blue">Case Manager</TableHead>
                    <TableHead className="font-semibold text-refuge-dark-blue">Unit</TableHead>
                    <TableHead className="font-semibold text-refuge-dark-blue">Map Status</TableHead>
                    <TableHead className="font-semibold text-refuge-dark-blue">Last Sync</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.homes.map((home, index) => (
                    <TableRow
                      key={home.id || index}
                      className="hover:bg-gradient-to-r hover:from-refuge-gray/30 hover:to-refuge-light-purple/10 transition-all duration-200 border-b border-refuge-gray/50"
                    >
                      <TableCell className="font-medium">
                        <div>
                          <div className="font-semibold text-refuge-dark-blue">{home.name}</div>
                          {home.id && <div className="text-xs text-refuge-dark-blue/60">ID: {home.id}</div>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-start gap-1">
                          <MapPin className="h-4 w-4 text-refuge-light-purple mt-0.5 flex-shrink-0" />
                          <div className="text-sm">
                            <div className="text-refuge-dark-blue">{home.address}</div>
                            <div className="text-refuge-dark-blue/70">
                              {home.City}, {home.State} {home.zipCode}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {home.phoneNumber && (
                          <div className="flex items-center gap-1 text-sm">
                            <Phone className="h-3 w-3 text-refuge-light-purple" />
                            <span className="text-refuge-dark-blue">{home.phoneNumber}</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="font-medium text-refuge-dark-blue">{home.contactPersonName}</div>
                          {home.email && (
                            <div className="flex items-center gap-1 text-xs text-refuge-dark-blue/70">
                              <Mail className="h-3 w-3 text-refuge-light-purple" />
                              {home.email}
                            </div>
                          )}
                          {home.contactPhone && (
                            <div className="flex items-center gap-1 text-xs text-refuge-dark-blue/70">
                              <Phone className="h-3 w-3 text-refuge-light-purple" />
                              {home.contactPhone}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className="text-xs border-refuge-light-purple text-refuge-purple bg-white/80"
                        >
                          {home.Unit || "N/A"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {hasValidCoordinates(home.latitude, home.longitude) ? (
                          <Badge
                            variant="default"
                            className="text-xs bg-gradient-to-r from-green-500 to-green-600 text-white shadow-sm"
                          >
                            ✓ On Map
                          </Badge>
                        ) : (
                          <Badge
                            variant="secondary"
                            className="text-xs bg-gradient-to-r from-yellow-400 to-yellow-500 text-yellow-900 shadow-sm"
                          >
                            No Location
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-xs text-refuge-dark-blue/70 font-mono">
                          {formatLastSync(home.lastSync)}
                        </div>
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
  )
}
