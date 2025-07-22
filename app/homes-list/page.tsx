"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { MapPin, Phone, Mail, Globe, Users, Search, AlertCircle, RefreshCw } from "lucide-react"

interface Home {
  id: number
  name: string
  address: string
  latitude?: number
  longitude?: number
  phone?: string
  email?: string
  website?: string
  capacity?: number
  current_residents?: number
  status: string
  created_at: Date
  updated_at: Date
}

export default function HomesListPage() {
  const [homes, setHomes] = useState<Home[]>([])
  const [filteredHomes, setFilteredHomes] = useState<Home[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")

  const fetchHomes = async () => {
    try {
      setLoading(true)
      setError(null)
      console.log("🏠 Fetching homes list...")

      const response = await fetch("/api/homes-list", {
        method: "GET",
        cache: "no-store",
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      console.log(`✅ Received ${data.length} homes`)
      setHomes(data)
      setFilteredHomes(data)
    } catch (err) {
      console.error("❌ Error fetching homes:", err)
      setError(err instanceof Error ? err.message : "Failed to fetch homes data")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchHomes()
  }, [])

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredHomes(homes)
    } else {
      const filtered = homes.filter(
        (home) =>
          home.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          home.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
          home.status.toLowerCase().includes(searchTerm.toLowerCase()),
      )
      setFilteredHomes(filtered)
    }
  }, [searchTerm, homes])

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Homes Directory</h1>
          <p className="text-muted-foreground">Loading homes data...</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
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
          <h1 className="text-3xl font-bold">Homes Directory</h1>
          <p className="text-muted-foreground">Complete directory of all homes</p>
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
      <div>
        <h1 className="text-3xl font-bold">Homes Directory</h1>
        <p className="text-muted-foreground">
          Complete directory of all homes ({homes.length} total, {filteredHomes.length} shown)
        </p>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search homes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button onClick={fetchHomes} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {filteredHomes.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No Homes Found</CardTitle>
            <CardDescription>
              {searchTerm ? "No homes match your search criteria." : "No homes are currently available."}
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredHomes.map((home) => (
            <Card key={home.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{home.name}</CardTitle>
                    <CardDescription className="flex items-center gap-1 mt-1">
                      <MapPin className="h-3 w-3" />
                      {home.address}
                    </CardDescription>
                  </div>
                  <Badge variant={home.status === "active" ? "default" : "secondary"}>{home.status}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* Coordinates (if available) */}
                  {home.latitude && home.longitude && (
                    <div className="text-sm text-muted-foreground">
                      <strong>Location:</strong> {home.latitude.toFixed(6)}, {home.longitude.toFixed(6)}
                    </div>
                  )}

                  {/* Capacity Info */}
                  {(home.capacity || home.current_residents) && (
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {home.current_residents || 0} / {home.capacity || 0} residents
                      </span>
                      {home.capacity && (
                        <Badge variant="outline" className="text-xs">
                          {Math.round(((home.current_residents || 0) / home.capacity) * 100)}% occupied
                        </Badge>
                      )}
                    </div>
                  )}

                  {/* Contact Info */}
                  <div className="space-y-1">
                    {home.phone && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Phone className="h-3 w-3" />
                        <span>{home.phone}</span>
                      </div>
                    )}
                    {home.email && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Mail className="h-3 w-3" />
                        <span>{home.email}</span>
                      </div>
                    )}
                    {home.website && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Globe className="h-3 w-3" />
                        <a
                          href={home.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          Visit Website
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Timestamps */}
                  <div className="text-xs text-muted-foreground pt-2 border-t">
                    <div>Created: {new Date(home.created_at).toLocaleDateString()}</div>
                    <div>Updated: {new Date(home.updated_at).toLocaleDateString()}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
