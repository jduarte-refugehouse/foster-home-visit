"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"

interface HomeData {
  Guid: string
  HomeName: string
  Street: string
  City: string
  State: string
  Zip: string
  Unit: string
  CaseManager: string
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
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      if (data.success) {
        setHomes(data.homes)
      } else {
        setError(data.error || "Failed to fetch homes data.")
      }
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchHomes()
  }, [])

  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-2xl font-bold">Homes List</CardTitle>
          <Button onClick={fetchHomes} disabled={loading} size="sm">
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh Data
          </Button>
        </CardHeader>
        <CardContent>
          {loading && <div className="text-center py-8">Loading homes data...</div>}
          {error && <div className="text-center py-8 text-red-500">Error: {error}</div>}
          {!loading && !error && homes.length === 0 && <div className="text-center py-8">No homes data available.</div>}
          {!loading && !error && homes.length > 0 && (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Home Name</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead>City</TableHead>
                    <TableHead>State</TableHead>
                    <TableHead>Zip</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead>Case Manager</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {homes.map((home) => (
                    <TableRow key={home.Guid}>
                      <TableCell className="font-medium">{home.HomeName}</TableCell>
                      <TableCell>{home.Street}</TableCell>
                      <TableCell>{home.City}</TableCell>
                      <TableCell>{home.State}</TableCell>
                      <TableCell>{home.Zip}</TableCell>
                      <TableCell>{home.Unit}</TableCell>
                      <TableCell>{home.CaseManager || "N/A"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
