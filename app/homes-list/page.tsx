"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, Phone, Mail, User, RefreshCw, ArrowLeft } from "lucide-react"
import Link from "next/link"

interface Home {
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
}

export default function HomesListPage() {
  const [homes, setHomes] = useState<Home[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")

  const fetchHomes = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch("/api/homes-list")
      const data = await response.json()

      if (data.success) {
        setHomes(data.homes)
      } else {
        setError(data.error || "Failed to fetch homes")
      }
    } catch (err) {
      setError("Network error occurred")
      console.error("Error fetching homes:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchHomes()
  }, [])

  const filteredHomes = homes.filter(
    (home) =>
      home.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      home.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      home.contactPersonName.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const formatCoordinates = (lat: number, lng: number) => {
    if (!lat || !lng || lat === 0 || lng === 0) {
      return "No coordinates"
    }
    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span>Loading homes...</span>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card className="border-red-200">
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-red-600 mb-4">Error: {error}</p>
              <Button onClick={fetchHomes} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Homes List</h1>
          <Badge variant="secondary">{filteredHomes.length} homes found</Badge>
        </div>
        <Button onClick={fetchHomes} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh Data
        </Button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <Input
          placeholder="Search homes by name, address, or case manager..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-md"
        />
      </div>

      {/* Table Header */}
      <Card>
        <CardHeader>
          <CardTitle>Active Homes from SyncActiveHomes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b text-left">
                  <th className="pb-3 text-sm font-medium text-gray-500">Home Name</th>
                  <th className="pb-3 text-sm font-medium text-gray-500">Address</th>
                  <th className="pb-3 text-sm font-medium text-gray-500">Phone</th>
                  <th className="pb-3 text-sm font-medium text-gray-500">Case Manager</th>
                  <th className="pb-3 text-sm font-medium text-gray-500">Unit</th>
                  <th className="pb-3 text-sm font-medium text-gray-500">Coordinates</th>
                  <th className="pb-3 text-sm font-medium text-gray-500">Last Sync</th>
                </tr>
              </thead>
              <tbody>
                {filteredHomes.map((home) => (
                  <tr key={home.id} className="border-b hover:bg-gray-50">
                    <td className="py-4">
                      <div className="font-medium">{home.name || "Unnamed Home"}</div>
                    </td>
                    <td className="py-4">
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <MapPin className="h-3 w-3" />
                        <span>
                          {home.address}, {home.City}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500">Unit: {home.Unit}</div>
                    </td>
                    <td className="py-4">
                      {home.phoneNumber && (
                        <div className="flex items-center gap-1 text-sm">
                          <Phone className="h-3 w-3" />
                          <span>{home.phoneNumber}</span>
                        </div>
                      )}
                    </td>
                    <td className="py-4">
                      <div className="flex items-center gap-1 text-sm">
                        <User className="h-3 w-3" />
                        <span>{home.contactPersonName}</span>
                      </div>
                      {home.email && (
                        <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                          <Mail className="h-3 w-3" />
                          <span>{home.email}</span>
                        </div>
                      )}
                    </td>
                    <td className="py-4">
                      <Badge variant={home.Unit === "DAL" ? "default" : "secondary"}>{home.Unit}</Badge>
                    </td>
                    <td className="py-4">
                      <span className="text-sm text-gray-600">{formatCoordinates(home.latitude, home.longitude)}</span>
                    </td>
                    <td className="py-4">
                      <span className="text-sm text-gray-500">Never</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredHomes.length === 0 && (
            <div className="text-center py-8 text-gray-500">No homes found matching your search criteria.</div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
