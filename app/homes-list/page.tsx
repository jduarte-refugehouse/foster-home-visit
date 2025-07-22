"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MapPin, AlertCircle, RefreshCw } from "lucide-react"

interface HomeType {
  id: number
  address: string
  city: string
  state: string
  zip_code: string
  latitude?: number
  longitude?: number
  status: string
  created_at: string
  updated_at: string
}

export default function HomesListPage() {
  const [homes, setHomes] = useState<HomeType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchHomes = async () => {
    setLoading(true)
    setError(null)

    try {
      console.log("Fetching homes data...")
      const response = await fetch("/api/homes-list", {
        method: "GET",
        cache: "no-store",
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      console.log("Homes data received:", data)
      setHomes(data)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error"
      setError(errorMessage)
      console.error("Error fetching homes:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchHomes()
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Homes List</h1>
          <p className="text-muted-foreground">Loading all homes...</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-3 bg-muted rounded w-full mb-2"></div>
                <div className="h-3 bg-muted rounded w-2/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Homes List</h1>
          <p className="text-muted-foreground">Complete list of all homes in the system</p>
        </div>
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-800 flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Error Loading Homes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-700 mb-4">{error}</p>
            <Button onClick={fetchHomes} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Homes List</h1>
          <p className="text-muted-foreground">Complete list of all homes in the system ({homes.length} total)</p>
        </div>
        <Button onClick={fetchHomes} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {homes.map((home) => (
          <Card key={home.id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  {/* Home icon is imported from lucide-react, not used here */}
                  Home #{home.id}
                </span>
                <Badge
                  variant={home.status === "active" ? "default" : home.status === "pending" ? "secondary" : "outline"}
                >
                  {home.status}
                </Badge>
              </CardTitle>
              <CardDescription>{home.address}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm font-medium">
                  {home.city}, {home.state} {home.zip_code}
                </p>
                {home.latitude && home.longitude ? (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {home.latitude.toFixed(6)}, {home.longitude.toFixed(6)}
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">No coordinates available</p>
                )}
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Added: {new Date(home.created_at).toLocaleDateString()}</span>
                  <span>Updated: {new Date(home.updated_at).toLocaleDateString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {homes.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            {/* Home icon is imported from lucide-react, not used here */}
            <h3 className="text-lg font-semibold mb-2">No Homes Found</h3>
            <p className="text-muted-foreground">No homes have been added to the system yet.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
