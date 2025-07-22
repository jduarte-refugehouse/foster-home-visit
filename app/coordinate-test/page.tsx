"use client"

import type React from "react"

import { useUser } from "@clerk/nextjs"
import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { MapPin, Search, AlertCircle, CheckCircle, Loader2 } from "lucide-react"
import Link from "next/link"

interface CoordinateResult {
  address: string
  latitude: number
  longitude: number
  confidence: string
}

export default function CoordinateTestPage() {
  const { isSignedIn, isLoaded } = useUser()
  const [address, setAddress] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<CoordinateResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  if (!isLoaded) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-32" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (!isSignedIn) {
    return (
      <div className="container mx-auto px-4 py-12">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-500" />
              Authentication Required
            </CardTitle>
            <CardDescription>You need to be signed in to test coordinates.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">Please sign in to access the coordinate testing tool.</p>
            <Link href="/sign-in">
              <Button className="w-full">Sign In</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const testCoordinates = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!address.trim()) return

    try {
      setLoading(true)
      setError(null)
      setResult(null)

      const response = await fetch("/api/test-coordinates", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ address }),
      })

      if (!response.ok) {
        throw new Error("Failed to geocode address")
      }

      const data = await response.json()
      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <MapPin className="h-8 w-8" />
          Coordinate Testing
        </h1>
        <p className="text-gray-600">Test address geocoding and coordinate lookup</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Input Form */}
        <Card>
          <CardHeader>
            <CardTitle>Address Lookup</CardTitle>
            <CardDescription>Enter an address to get its coordinates</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={testCoordinates} className="space-y-4">
              <div>
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="123 Main St, City, State ZIP"
                  required
                />
              </div>
              <Button type="submit" disabled={loading} className="w-full">
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Looking up...
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4 mr-2" />
                    Get Coordinates
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Results */}
        <Card>
          <CardHeader>
            <CardTitle>Results</CardTitle>
            <CardDescription>Geocoding results and coordinate information</CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="flex items-center gap-2 text-red-600 p-4 bg-red-50 rounded-lg">
                <AlertCircle className="h-5 w-5" />
                <span>{error}</span>
              </div>
            )}

            {result && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-green-600 p-4 bg-green-50 rounded-lg">
                  <CheckCircle className="h-5 w-5" />
                  <span>Address successfully geocoded!</span>
                </div>

                <div className="space-y-3">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Address</Label>
                    <p className="text-sm">{result.address}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Latitude</Label>
                    <p className="text-sm font-mono">{result.latitude}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Longitude</Label>
                    <p className="text-sm font-mono">{result.longitude}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Confidence</Label>
                    <p className="text-sm">{result.confidence}</p>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <Label className="text-sm font-medium text-gray-600">Google Maps Link</Label>
                  <div className="mt-2">
                    <Button variant="outline" size="sm" asChild>
                      <a
                        href={`https://www.google.com/maps?q=${result.latitude},${result.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <MapPin className="h-4 w-4 mr-2" />
                        View on Google Maps
                      </a>
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {!result && !error && !loading && (
              <div className="text-center py-8 text-gray-500">
                <MapPin className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Enter an address above to get started</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Additional Tools */}
      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Additional Tools</CardTitle>
            <CardDescription>Other diagnostic and testing utilities</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <Button variant="outline" asChild>
                <Link href="/diagnostics" prefetch={false}>
                  System Diagnostics
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/homes-map" prefetch={false}>
                  View Homes Map
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/admin" prefetch={false}>
                  Admin Panel
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
