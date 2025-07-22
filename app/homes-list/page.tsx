"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Phone, Mail, MapPin, RefreshCw, AlertCircle, Search } from "lucide-react"

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
  created_at: string
  updated_at: string
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
      const response = await fetch("/api/homes-list")

      if (!response.ok) {
        throw new Error(`Failed to fetch homes: ${response.statusText}`)
      }

      const data = await response.json()
      setHomes(data.homes || [])
      setFilteredHomes(data.homes || [])
    } catch (err) {
      console.error("Error fetching homes:", err)
      setError(err instanceof Error ? err.message : "Failed to fetch homes")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchHomes()
  }, [])

  useEffect(() => {
    if (searchTerm) {
      const filtered = homes.filter(
        (home) =>
          home.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          home.address.toLowerCase().includes(searchTerm.toLowerCase()),
      )
      setFilteredHomes(filtered)
    } else {
      setFilteredHomes(homes)
    }
  }, [searchTerm, homes])

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              <span>Error: {error}</span>
            </div>
            <Button onClick={fetchHomes} className="mt-4 bg-transparent" variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Homes List</h1>
          <p className="text-muted-foreground">
            Showing {filteredHomes.length} of {homes.length} homes
          </p>
        </div>
        <Button onClick={fetchHomes} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search homes by name or address..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {filteredHomes.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">{searchTerm ? "No matching homes found" : "No homes found"}</h3>
            <p className="text-muted-foreground">
              {searchTerm ? "Try adjusting your search terms." : "No homes are currently available in the system."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredHomes.map((home) => (
            <Card key={home.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{home.name}</CardTitle>
                    <CardDescription>{home.address}</CardDescription>
                  </div>
                  <Badge variant={home.status === "active" ? "default" : "secondary"}>{home.status}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {home.latitude && home.longitude && (
                    <div className="flex items-center space-x-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {home.latitude.toFixed(6)}, {home.longitude.toFixed(6)}
                      </span>
                    </div>
                  )}

                  {home.phone && (
                    <div className="flex items-center space-x-2 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{home.phone}</span>
                    </div>
                  )}

                  {home.email && (
                    <div className="flex items-center space-x-2 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>{home.email}</span>
                    </div>
                  )}

                  {home.capacity && (
                    <div className="text-sm">
                      <span className="text-muted-foreground">Capacity: </span>
                      <span>
                        {home.current_residents || 0} / {home.capacity}
                      </span>
                    </div>
                  )}

                  <div className="text-xs text-muted-foreground">
                    Added: {new Date(home.created_at).toLocaleDateString()}
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
