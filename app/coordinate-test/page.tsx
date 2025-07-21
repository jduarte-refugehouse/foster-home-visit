"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useState, useEffect } from "react"
import { Loader2, RefreshCw } from "lucide-react"
import Link from "next/link"

interface HomeCoordinateData {
  HomeID: number
  Address: string
  Latitude: number
  Longitude: number
}

export default function CoordinateTestPage() {
  const [homes, setHomes] = useState<HomeCoordinateData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchHomesWithCoordinates = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch("/api/test-coordinates")
      const data = await response.json()
      if (data.success) {
        setHomes(data.data)
      } else {
        setError(data.message || "Failed to fetch homes with coordinates.")
      }
    } catch (err: any) {
      console.error("Error fetching homes with coordinates:", err)
      setError(err.message || "An unexpected error occurred.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchHomesWithCoordinates()
  }, [])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-4xl shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-gray-900 dark:text-gray-50">
            Coordinate Column Access Test
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-lg text-gray-700 dark:text-gray-300 text-center">
            This page tests the application's ability to retrieve `Latitude` and `Longitude` data from your database. It
            displays the first 5 homes that have coordinate data.
          </p>

          {loading && (
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
              <p className="mt-4 text-xl font-medium">Loading coordinate data...</p>
            </div>
          )}

          {error && (
            <div
              className="bg-red-100 dark:bg-red-900 border border-red-400 text-red-700 dark:text-red-300 px-4 py-3 rounded relative"
              role="alert"
            >
              <strong className="font-bold">Error:</strong>
              <span className="block sm:inline"> {error}</span>
            </div>
          )}

          {!loading &&
            !error &&
            (homes.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Home ID</TableHead>
                      <TableHead>Address</TableHead>
                      <TableHead>Latitude</TableHead>
                      <TableHead>Longitude</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {homes.map((home) => (
                      <TableRow key={home.HomeID}>
                        <TableCell className="font-medium">{home.HomeID}</TableCell>
                        <TableCell>{home.Address}</TableCell>
                        <TableCell>{home.Latitude}</TableCell>
                        <TableCell>{home.Longitude}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-600 dark:text-gray-400">
                <p>No homes with Latitude and Longitude data found in the database.</p>
                <p>Please ensure your `Homes` table has `Latitude` and `Longitude` columns with data.</p>
              </div>
            ))}

          <div className="flex flex-col sm:flex-row justify-center gap-4 mt-8">
            <Button onClick={fetchHomesWithCoordinates} disabled={loading} className="w-full sm:w-auto">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Data
            </Button>
            <Link href="/homes-map">
              <Button className="w-full sm:w-auto bg-transparent" variant="outline">
                View Homes Map
              </Button>
            </Link>
            <Link href="/">
              <Button className="w-full sm:w-auto" variant="default">
                Back to Home
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
