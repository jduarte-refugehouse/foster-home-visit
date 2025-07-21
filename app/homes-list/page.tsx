"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useState, useEffect } from "react"
import { Loader2, RefreshCw } from "lucide-react"
import Link from "next/link"

interface HomeData {
  id: number
  address: string
  city: string
  state: string
  zipCode: string
}

export default function HomesListPage() {
  const [homes, setHomes] = useState<HomeData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchHomes = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch("/api/homes-list")
      const data = await response.json()
      if (data.success) {
        setHomes(data.data)
      } else {
        setError(data.message || "Failed to fetch homes data.")
      }
    } catch (err: any) {
      console.error("Error fetching homes list:", err)
      setError(err.message || "An unexpected error occurred.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchHomes()
  }, [])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-4xl shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-gray-900 dark:text-gray-50">Registered Homes List</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-lg text-gray-700 dark:text-gray-300 text-center">
            A comprehensive list of all homes registered in the system.
          </p>

          {loading && (
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
              <p className="mt-4 text-xl font-medium">Loading homes data...</p>
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
                      <TableHead>ID</TableHead>
                      <TableHead>Address</TableHead>
                      <TableHead>City</TableHead>
                      <TableHead>State</TableHead>
                      <TableHead>Zip Code</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {homes.map((home) => (
                      <TableRow key={home.id}>
                        <TableCell className="font-medium">{home.id}</TableCell>
                        <TableCell>{home.address}</TableCell>
                        <TableCell>{home.city}</TableCell>
                        <TableCell>{home.state}</TableCell>
                        <TableCell>{home.zipCode}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-600 dark:text-gray-400">
                <p>No homes found in the database.</p>
              </div>
            ))}

          <div className="flex flex-col sm:flex-row justify-center gap-4 mt-8">
            <Button onClick={fetchHomes} disabled={loading} className="w-full sm:w-auto">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh List
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
