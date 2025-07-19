"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Home, RefreshCw, CheckCircle, XCircle, ArrowLeft } from "lucide-react"
import Link from "next/link"

interface HomesData {
  success: boolean
  homes?: any[]
  count?: number
  error?: string
  message?: string
}

export default function HomesDisplay() {
  const [data, setData] = useState<HomesData | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchHomes = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/homes")
      const result = await response.json()
      setData(result)
    } catch (error) {
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link href="/">
                <Button variant="ghost">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Home
                </Button>
              </Link>
              <div className="flex items-center space-x-2">
                <Home className="w-6 h-6 text-blue-600" />
                <span className="text-lg font-semibold text-gray-900">Active Homes</span>
              </div>
            </div>
            <Button onClick={fetchHomes} disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              {loading ? "Loading..." : "Refresh"}
            </Button>
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Active Homes</h1>
            <p className="text-gray-600">Data from SyncActiveHomes table</p>
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
              {/* Status Card */}
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
                    <Badge variant={data.success ? "default" : "destructive"}>
                      {data.success ? `${data.count || 0} records` : "Failed"}
                    </Badge>
                  </div>
                  <CardDescription>
                    {data.success ? "Successfully retrieved homes data" : "Failed to retrieve homes data"}
                  </CardDescription>
                </CardHeader>
                {data.error && (
                  <CardContent>
                    <Alert>
                      <XCircle className="h-4 w-4" />
                      <AlertDescription>{data.error}</AlertDescription>
                      {data.message && <AlertDescription className="mt-2 text-sm">{data.message}</AlertDescription>}
                    </Alert>
                  </CardContent>
                )}
              </Card>

              {/* Homes Data */}
              {data.success && data.homes && data.homes.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Homes Data</CardTitle>
                    <CardDescription>First {data.homes.length} records from SyncActiveHomes table</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {data.homes.map((home, index) => (
                        <Card key={index} className="bg-gray-50">
                          <CardContent className="pt-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 text-sm">
                              {Object.entries(home).map(([key, value]) => (
                                <div key={key} className="truncate">
                                  <strong className="text-gray-700">{key}:</strong>{" "}
                                  <span className="text-gray-900">{value === null ? "NULL" : String(value)}</span>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {data.success && (!data.homes || data.homes.length === 0) && (
                <Card>
                  <CardContent className="text-center py-12">
                    <Home className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No homes found</h3>
                    <p className="text-gray-500">The SyncActiveHomes table appears to be empty</p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
