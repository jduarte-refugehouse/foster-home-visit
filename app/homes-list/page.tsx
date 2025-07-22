"use client"

import { useUser } from "@clerk/nextjs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Filter, Download, Eye } from "lucide-react"

// Force dynamic rendering
export const dynamic = "force-dynamic"

export default function HomesListPage() {
  const { isSignedIn, isLoaded } = useUser()

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!isSignedIn) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
        <p className="text-muted-foreground">Please sign in to access the homes list.</p>
      </div>
    )
  }

  const homes = [
    {
      id: 1,
      name: "Johnson Family Home",
      address: "123 Oak Street, Springfield, IL 62701",
      caseManager: "Sarah Wilson",
      status: "Active",
      lastVisit: "2024-01-10",
      nextVisit: "2024-02-10",
      capacity: 4,
      occupied: 3,
    },
    {
      id: 2,
      name: "Smith Foster Care",
      address: "456 Pine Avenue, Springfield, IL 62702",
      caseManager: "Mike Johnson",
      status: "Active",
      lastVisit: "2024-01-08",
      nextVisit: "2024-02-08",
      capacity: 6,
      occupied: 5,
    },
    {
      id: 3,
      name: "Davis Residence",
      address: "789 Maple Drive, Springfield, IL 62703",
      caseManager: "Emily Brown",
      status: "Pending Review",
      lastVisit: "2023-12-15",
      nextVisit: "2024-01-25",
      capacity: 3,
      occupied: 2,
    },
    {
      id: 4,
      name: "Wilson Family",
      address: "321 Elm Street, Springfield, IL 62704",
      caseManager: "David Lee",
      status: "Active",
      lastVisit: "2024-01-12",
      nextVisit: "2024-02-12",
      capacity: 5,
      occupied: 4,
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Homes List</h1>
          <p className="text-muted-foreground">Comprehensive list of all foster homes</p>
        </div>
        <Button>
          <Download className="w-4 h-4 mr-2" />
          Export
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div>
              <CardTitle>Foster Homes Directory</CardTitle>
              <CardDescription>{homes.length} homes found</CardDescription>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input placeholder="Search homes..." className="pl-10" />
              </div>
              <Button variant="outline" size="icon">
                <Filter className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {homes.map((home) => (
              <Card key={home.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg">{home.name}</h3>
                        <Badge variant={home.status === "Active" ? "default" : "secondary"}>{home.status}</Badge>
                      </div>
                      <p className="text-muted-foreground mb-2">{home.address}</p>
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        <span>Case Manager: {home.caseManager}</span>
                        <span>
                          Capacity: {home.occupied}/{home.capacity}
                        </span>
                        <span>Last Visit: {home.lastVisit}</span>
                        <span>Next Visit: {home.nextVisit}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Eye className="w-4 h-4 mr-2" />
                        View Details
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
