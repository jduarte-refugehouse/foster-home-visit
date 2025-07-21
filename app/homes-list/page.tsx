"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { RefreshCw, ArrowLeft, MapPin, Phone, Mail } from "lucide-react"
import Link from "next/link"

interface HomeData {
  HomeName: string
  Street: string
  City: string
  State: string
  Zip: string
  HomePhone: string
  Xref: string
  CaseManager: string
  Unit: string
  Guid: string
  CaseManagerEmail: string
  CaseManagerPhone: string
  CaregiverEmail: string
  LastSync: string
  Latitude: number | null // These should be numbers from decimal(9,6) in database
  Longitude: number | null
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
                      <TableHead>Coordinates</TableHead>
                      <TableHead>Last Sync</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.homes.map((home, index) => (
                      <TableRow key={home.Guid || index}>
                        <TableCell className="font-medium">
                          <div>
                            <div className="font-semibold">{home.HomeName}</div>
                            {home.Xref && <div className="text-xs text-gray-500">Ref: {home.Xref}</div>}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-start gap-1">
                            <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                            <div className="text-sm">
                              <div>{home.Street}</div>
                              <div className="text-gray-600">
                                {home.City}, {home.State} {home.Zip}
                              </div>
                              {home.Unit && <div className="text-gray-500">Unit: {home.Unit}</div>}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {home.HomePhone && (
                            <div className="flex items-center gap-1 text-sm">
                              <Phone className="h-3 w-3 text-gray-400" />
                              {home.HomePhone}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div className="font-medium">{home.CaseManager}</div>
                            {home.CaseManagerEmail && (
                              <div className="flex items-center gap-1 text-xs text-gray-600">
                                <Mail className="h-3 w-3" />
                                {home.CaseManagerEmail}
                              </div>
                            )}
                            {home.CaseManagerPhone && (
                              <div className="flex items-center gap-1 text-xs text-gray-600">
                                <Phone className="h-3 w-3" />
                                {home.CaseManagerPhone}
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
                          {home.Latitude && home.Longitude ? (
                            <div className="text-xs font-mono">
                              <div>{home.Latitude.toFixed(6)}</div>
                              <div>{home.Longitude.toFixed(6)}</div>
                            </div>
                          ) : (
                            <span className="text-gray-400 text-xs">No coordinates</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {home.LastSync ? (
                            <div className="text-xs text-gray-600">{new Date(home.LastSync).toLocaleDateString()}</div>
                          ) : (
                            <span className="text-gray-400 text-xs">Never</span>
                          )}
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
