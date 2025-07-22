"use client"

import { useEffect, useState } from "react"
import { useUser } from "@clerk/nextjs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, Filter, MapPin, Phone, Mail, Users, Calendar } from "lucide-react"

export const dynamic = "force-dynamic"

interface Home {
  id: number
  name: string
  address: string
  city: string
  state: string
  zip: string
  phone?: string
  email?: string
  capacity: number
  current_residents: number
  license_number: string
  license_expiry: string
  status: string
  last_visit?: string
  next_visit?: string
}

export default function HomesListPage() {
  const { isLoaded } = useUser()
  const [homes, setHomes] = useState<Home[]>([])
  const [filteredHomes, setFilteredHomes] = useState<Home[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  useEffect(() => {
    fetchHomes()
  }, [])

  useEffect(() => {
    let filtered = homes

    if (searchTerm) {
      filtered = filtered.filter(
        (home) =>
          home.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          home.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
          home.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
          home.license_number.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((home) => home.status.toLowerCase() === statusFilter)
    }

    setFilteredHomes(filtered)
  }, [homes, searchTerm, statusFilter])

  const fetchHomes = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch("/api/homes-list")
      if (!response.ok) {
        throw new Error("Failed to fetch homes data")
      }
      const data = await response.json()
      setHomes(data.homes || [])
    } catch (err) {
      console.error("Error fetching homes:", err)
      setError(err instanceof Error ? err.message : "An unknown error occurred")
    } finally {
      setLoading(false)
    }
  }

  if (!isLoaded || loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-8rem)]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading homes list...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Error Loading Data</h1>
        <p className="text-gray-600 mb-4">{error}</p>
        <Button onClick={fetchHomes}>Try Again</Button>
      </div>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return "bg-green-100 text-green-800"
      case "inactive":
        return "bg-red-100 text-red-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "N/A"
    return new Date(dateString).toLocaleDateString()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Homes List</h1>
        <p className="text-gray-600">Comprehensive list of all foster homes</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="mr-2 h-5 w-5" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search homes by name, address, city, or license..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="mt-4 text-sm text-gray-600">
            Showing {filteredHomes.length} of {homes.length} homes
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Foster Homes</CardTitle>
          <CardDescription>Detailed information about all registered foster homes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Capacity</TableHead>
                  <TableHead>License</TableHead>
                  <TableHead>Last Visit</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredHomes.map((home) => (
                  <TableRow key={home.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{home.name}</div>
                        <div className="text-sm text-gray-500 flex items-center mt-1">
                          {home.phone && (
                            <span className="flex items-center mr-3">
                              <Phone className="h-3 w-3 mr-1" />
                              {home.phone}
                            </span>
                          )}
                          {home.email && (
                            <span className="flex items-center">
                              <Mail className="h-3 w-3 mr-1" />
                              {home.email}
                            </span>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-start">
                        <MapPin className="h-4 w-4 mr-1 mt-0.5 text-gray-400" />
                        <div className="text-sm">
                          <div>{home.address}</div>
                          <div className="text-gray-500">
                            {home.city}, {home.state} {home.zip}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(home.status)}>{home.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Users className="h-4 w-4 mr-1 text-gray-400" />
                        <span className="text-sm">
                          {home.current_residents} / {home.capacity}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{home.license_number}</div>
                        <div className="text-gray-500">Expires: {formatDate(home.license_expiry)}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center text-sm">
                        <Calendar className="h-4 w-4 mr-1 text-gray-400" />
                        {formatDate(home.last_visit)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredHomes.length === 0 && !loading && (
            <div className="text-center py-8 text-gray-500">
              <div className="text-lg font-medium mb-2">No homes found</div>
              <p>Try adjusting your search criteria or filters.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
