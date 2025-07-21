"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MapPin, Phone, Mail, Globe, Users, ArrowLeft } from "lucide-react"
import Link from "next/link"

interface Home {
  Id: number
  Name: string
  Address: string
  City: string
  State: string
  ZipCode: string
  Latitude?: number
  Longitude?: number
  PhoneNumber?: string
  Email?: string
  Website?: string
  Description?: string
  Capacity?: number
  ServicesOffered?: string
  ContactPersonName?: string
  ContactPersonTitle?: string
  IsActive: boolean
  CreatedDate: string
  ModifiedDate: string
}

export default function HomesListPage() {
  const [homes, setHomes] = useState<Home[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchHomes = async () => {
      try {
        const response = await fetch("/api/homes-list")
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        const data = await response.json()
        setHomes(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred")
      } finally {
        setLoading(false)
      }
    }

    fetchHomes()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading homes...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-12">
            <div className="text-red-600 mb-4">Error: {error}</div>
            <Button onClick={() => window.location.reload()}>Try Again</Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">Homes Directory</h1>
          </div>
          <Badge variant="outline" className="text-sm">
            {homes.length} homes found
          </Badge>
        </div>

        {/* Homes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {homes.map((home) => (
            <Card key={home.Id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="text-lg">{home.Name}</CardTitle>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin className="h-4 w-4" />
                  {home.Address}, {home.City}, {home.State} {home.ZipCode}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {home.Description && <p className="text-sm text-gray-700 line-clamp-3">{home.Description}</p>}

                <div className="space-y-2">
                  {home.PhoneNumber && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-gray-500" />
                      <span>{home.PhoneNumber}</span>
                    </div>
                  )}
                  {home.Email && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-gray-500" />
                      <span>{home.Email}</span>
                    </div>
                  )}
                  {home.Website && (
                    <div className="flex items-center gap-2 text-sm">
                      <Globe className="h-4 w-4 text-gray-500" />
                      <a
                        href={home.Website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        Visit Website
                      </a>
                    </div>
                  )}
                  {home.Capacity && (
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="h-4 w-4 text-gray-500" />
                      <span>Capacity: {home.Capacity}</span>
                    </div>
                  )}
                </div>

                {home.ServicesOffered && (
                  <div>
                    <h4 className="font-medium text-sm mb-2">Services Offered:</h4>
                    <p className="text-sm text-gray-600">{home.ServicesOffered}</p>
                  </div>
                )}

                {home.ContactPersonName && (
                  <div>
                    <h4 className="font-medium text-sm mb-1">Contact Person:</h4>
                    <p className="text-sm text-gray-600">
                      {home.ContactPersonName}
                      {home.ContactPersonTitle && ` - ${home.ContactPersonTitle}`}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {homes.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-600 mb-4">No homes found.</div>
            <Button onClick={() => window.location.reload()}>Refresh</Button>
          </div>
        )}
      </div>
    </div>
  )
}
