"use client"

import { useEffect, useState } from "react"
import dynamic from "next/dynamic"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Home, RefreshCw, XCircle, ArrowLeft, Shield } from "lucide-react"
import Link from "next/link"

interface HomeLocation {
  Guid: string
  HomeName: string
  Latitude: number
  Longitude: number
}

interface HomesData {
  success: boolean
  homes?: HomeLocation[]
  count?: number
  error?: string
}

const Map = dynamic(() => import("@/components/homes-map"), {
  ssr: false,
  loading: () => (
    <div className="h-[600px] w-full bg-gray-200 animate-pulse flex items-center justify-center">
      <p className="text-gray-500">Loading map...</p>
    </div>
  ),
})

export default function HomesMapPage() {
  const [data, setData] = useState<HomesData | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchHomes = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/homes-for-map")
      const result = await response.json()
      setData(result)
    } catch (error) {
      setData({
        success: false,
        error: "Failed to connect to API",
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
      <nav className="bg-white border-b border-gray-200">
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
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Home className="w-5 h-5 mr-2" />
              Active Homes Map
            </CardTitle>
            <CardDescription>
              {loading ? "Loading homes..." : `Showing ${data?.count || 0} homes with valid locations on the map.`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading && (
              <div className="h-[600px] w-full bg-gray-100 rounded-md flex items-center justify-center">
                <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
              </div>
            )}
            {data && !data.success && (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Error:</strong> {data.error}
                </AlertDescription>
              </Alert>
            )}
            {data && data.success && data.homes && <Map homes={data.homes} />}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
