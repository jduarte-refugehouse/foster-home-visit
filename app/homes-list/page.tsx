"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useAuth } from "@clerk/nextjs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Search, Phone, Mail, MapPin, Calendar, User, Building } from "lucide-react"

interface HomeData {
  id: number
  name: string
  address: string
  city: string
  state: string
  zipCode: string
  phone: string
  email: string
  contactPerson: string
  latitude: number | null
  longitude: number | null
  lastSync: Date
  unit: string
  caseManager: string
  status: string
}

interface HomesListResponse {
  homes: HomeData[]
  filters: {
    units: string[]
    caseManagers: string[]
  }
}

export default function HomesListPage() {
  const { isSignedIn, isLoaded } = useAuth()
  const [data, setData] = useState<HomesListResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedUnit, setSelectedUnit] = useState("all")
  const [selectedCaseManager, setSelectedCaseManager] = useState("all")

  const fetchHomes = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (selectedUnit !== "all") params.append("unit", selectedUnit)
      if (selectedCaseManager !== "all") params.append("caseManager", selectedCaseManager)
      if (searchTerm) params.append("search", searchTerm)

      const response = await fetch(`/api/homes-list?${params}`)
      if (!response.ok) {
        throw new Error("Failed to fetch homes data")
      }

      const result = await response.json()
      setData(result)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      fetchHomes()
    }
  }, [isLoaded, isSignedIn, selectedUnit, selectedCaseManager])

  const handleSearch = () => {
    if (isSignedIn) {
      fetchHomes()
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch()
    }
  }

  if (!isLoaded) {
    return (
      <div className="container mx-auto p-6">
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
          </div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!isSignedIn) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold mb-2">Authentication Required</h2>
              <p className="text-gray-600 mb-4">Please sign in to view the homes list.</p>
              <Button asChild>
                <a href="/sign-in">Sign In</a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Homes List</h1>
          <Badge variant="outline">{data?.homes.length || 0} homes</Badge>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Search & Filter
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <Input
                  placeholder="Search homes, addresses, or contacts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={handleKeyPress}
                />
              </div>
              <Select value={selectedUnit} onValueChange={setSelectedUnit}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Unit" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Units</SelectItem>
                  {data?.filters.units.map((unit) => (
                    <SelectItem key={unit} value={unit}>
                      {unit}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedCaseManager} onValueChange={setSelectedCaseManager}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Case Manager" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Case Managers</SelectItem>
                  {data?.filters.caseManagers.map((cm) => (
                    <SelectItem key={cm} value={cm}>
                      {cm}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="mt-4">
              <Button onClick={handleSearch} className="w-full md:w-auto">
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        ) : error ? (
          <Card>
            <CardContent className="p-6">
              <div className="text-center text-red-600">
                <p>Error: {error}</p>
                <Button onClick={fetchHomes} className="mt-4">
                  Try Again
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {data?.homes.map((home) => (
              <Card key={home.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Basic Info */}
                    <div className="space-y-3">
                      <div>
                        <h3 className="text-lg font-semibold">{home.name}</h3>
                        <div className="flex items-center gap-2 text-gray-600">
                          <MapPin className="h-4 w-4" />
                          <span className="text-sm">
                            {home.address}, {home.city}, {home.state} {home.zipCode}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Badge variant="secondary">
                          <Building className="h-3 w-3 mr-1" />
                          {home.unit}
                        </Badge>
                        <Badge
                          variant="outline"
                          className={home.status === "Active" ? "border-green-500 text-green-700" : ""}
                        >
                          {home.status}
                        </Badge>
                      </div>
                    </div>

                    {/* Contact Info */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-500" />
                        <span className="text-sm">
                          <strong>Contact:</strong> {home.contactPerson}
                        </span>
                      </div>
                      {home.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-gray-500" />
                          <span className="text-sm">{home.phone}</span>
                        </div>
                      )}
                      {home.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-gray-500" />
                          <span className="text-sm">{home.email}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-500" />
                        <span className="text-sm">
                          <strong>Case Manager:</strong> {home.caseManager}
                        </span>
                      </div>
                    </div>

                    {/* Status Info */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <span className="text-sm">
                          <strong>Last Sync:</strong> {new Date(home.lastSync).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-gray-500" />
                        <span className="text-sm">
                          <strong>Coordinates:</strong>{" "}
                          {home.latitude && home.longitude ? (
                            <Badge variant="outline" className="border-green-500 text-green-700">
                              Available
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="border-red-500 text-red-700">
                              Missing
                            </Badge>
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {data?.homes.length === 0 && (
              <Card>
                <CardContent className="p-6">
                  <div className="text-center text-gray-500">
                    <p>No homes found matching your criteria.</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
