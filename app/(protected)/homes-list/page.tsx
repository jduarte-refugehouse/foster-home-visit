"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 bg-slate-50 dark:bg-slate-950 min-h-screen">
      {/* Action Bar */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-slate-100">Foster Homes</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
            Active foster homes and contact information
          </p>
        </div>
        <div className="flex items-center gap-4">
          {data && (
            <Badge className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-refuge-purple/10 text-refuge-purple dark:bg-refuge-purple/20 dark:text-refuge-purple-light border-0">
              {data.count} homes found
            </Badge>
          )}
          <Button
            onClick={fetchHomes}
            disabled={loading}
            className="px-4 py-2 bg-refuge-purple hover:bg-refuge-purple-dark text-white font-medium rounded-lg transition-all duration-200 active:scale-95 transform shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh Data
          </Button>
        </div>
      </div>

      <Card className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        <CardContent className="p-0">
          {loading && (
            <div className="text-center py-16 bg-slate-50 dark:bg-slate-800/50">
              <RefreshCw className="h-12 w-12 animate-spin text-refuge-purple mx-auto mb-4" />
              <p className="text-slate-600 dark:text-slate-400 font-medium">Loading homes data...</p>
            </div>
          )}

          {!loading && data && !data.success && (
            <div className="text-center py-16 bg-red-50 dark:bg-red-900/20">
              <div className="text-red-600 dark:text-red-400 mb-4 font-medium">
                <strong>Error:</strong> {data.error}
              </div>
              <Button
                onClick={fetchHomes}
                className="px-4 py-2 bg-refuge-purple hover:bg-refuge-purple-dark text-white font-medium rounded-lg transition-all duration-200 active:scale-95 transform shadow-sm hover:shadow-md"
              >
                Try Again
              </Button>
            </div>
          )}

          {!loading && data && data.success && data.homes.length === 0 && (
            <div className="text-center py-16 bg-slate-50 dark:bg-slate-800/50">
              <p className="text-slate-600 dark:text-slate-400 mb-4 font-medium">No homes data available.</p>
              <Button
                onClick={fetchHomes}
                className="px-4 py-2 bg-refuge-purple hover:bg-refuge-purple-dark text-white font-medium rounded-lg transition-all duration-200 active:scale-95 transform shadow-sm hover:shadow-md"
              >
                Refresh
              </Button>
            </div>
          )}

          {!loading && data && data.success && data.homes.length > 0 && (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <TableHead className="font-semibold text-slate-900 dark:text-slate-100 px-6 py-4">
                      Home Name
                    </TableHead>
                    <TableHead className="font-semibold text-slate-900 dark:text-slate-100 px-6 py-4">
                      Address
                    </TableHead>
                    <TableHead className="font-semibold text-slate-900 dark:text-slate-100 px-6 py-4">Phone</TableHead>
                    <TableHead className="font-semibold text-slate-900 dark:text-slate-100 px-6 py-4">
                      Case Manager
                    </TableHead>
                    <TableHead className="font-semibold text-slate-900 dark:text-slate-100 px-6 py-4">Unit</TableHead>
                    <TableHead className="font-semibold text-slate-900 dark:text-slate-100 px-6 py-4">
                      Map Status
                    </TableHead>
                    <TableHead className="font-semibold text-slate-900 dark:text-slate-100 px-6 py-4">
                      Last Sync
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.homes.map((home, index) => (
                    <TableRow
                      key={home.id || index}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors duration-200 border-b border-slate-100 dark:border-slate-800"
                    >
                      <TableCell className="font-medium px-6 py-4">
                        <div>
                          <div className="font-semibold text-slate-900 dark:text-slate-100">{home.name}</div>
                          {home.id && (
                            <div className="text-xs text-slate-500 dark:text-slate-500 mt-1">ID: {home.id}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        <div className="flex items-start gap-2">
                          <MapPin className="h-4 w-4 text-refuge-purple mt-0.5 flex-shrink-0" />
                          <div className="text-sm">
                            <div className="text-slate-900 dark:text-slate-100 font-medium">{home.address}</div>
                            <div className="text-slate-600 dark:text-slate-400">
                              {home.City}, {home.State} {home.zipCode}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        {home.phoneNumber && (
                          <div className="flex items-center gap-2 text-sm">
                            <Phone className="h-3 w-3 text-refuge-purple" />
                            <span className="text-slate-900 dark:text-slate-100">{home.phoneNumber}</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        <div className="text-sm">
                          <div className="font-medium text-slate-900 dark:text-slate-100">{home.contactPersonName}</div>
                          {home.email && (
                            <div className="flex items-center gap-1 text-xs text-slate-600 dark:text-slate-400 mt-1">
                              <Mail className="h-3 w-3 text-refuge-purple" />
                              {home.email}
                            </div>
                          )}
                          {home.contactPhone && (
                            <div className="flex items-center gap-1 text-xs text-slate-600 dark:text-slate-400 mt-1">
                              <Phone className="h-3 w-3 text-refuge-purple" />
                              {home.contactPhone}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        <Badge className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-0">
                          {home.Unit || "N/A"}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        {hasValidCoordinates(home.latitude, home.longitude) ? (
                          <Badge className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-0">
                            ✓ On Map
                          </Badge>
                        ) : (
                          <Badge className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-0">
                            No Location
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        <div className="text-xs text-slate-500 dark:text-slate-500 font-mono">
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
