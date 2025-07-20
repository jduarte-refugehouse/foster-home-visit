"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { RefreshCw, CheckCircle, XCircle, ArrowLeft, Shield } from "lucide-react"
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
            <p className="text-gray-600">Displaying data directly from the SyncActiveHomes table.</p>
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
                    <Badge variant={data.success ? "default" : "destructive"}>
                      {data.success ? `${data.count || 0} records found` : "Failed"}
                    </Badge>
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
                    <Card key={home.Guid}>
                      <CardHeader>
                        <CardTitle>{home.HomeName}</CardTitle>
                        <CardDescription>Case Manager: {home.CaseManager || "N/A"}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="text-sm">
                          <p>
                            {home.Street}, {home.City}, {home.State} {home.Zip}
                          </p>
                          <p>
                            <strong>Phone:</strong> {home.HomePhone || "N/A"}
                          </p>
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
