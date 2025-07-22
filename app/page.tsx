"use client"

import { useUser } from "@clerk/nextjs"
import { Navigation } from "@/components/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MapPin, List, BarChart3, Users, Shield, Clock } from "lucide-react"
import Link from "next/link"

// Force dynamic rendering
export const dynamic = "force-dynamic"

export default function HomePage() {
  const { isSignedIn, isLoaded } = useUser()

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl md:text-6xl">Foster Home Visits</h1>
            <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
              Streamline your foster home management with our comprehensive platform for tracking visits, inspections,
              and compliance.
            </p>
          </div>

          {isSignedIn ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <MapPin className="w-5 h-5 mr-2 text-blue-600" />
                    Homes Map
                  </CardTitle>
                  <CardDescription>
                    View all foster homes on an interactive map with location details and status indicators.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href="/homes-map">
                    <Button className="w-full">View Map</Button>
                  </Link>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <List className="w-5 h-5 mr-2 text-green-600" />
                    Homes List
                  </CardTitle>
                  <CardDescription>
                    Browse a detailed list of all foster homes with comprehensive information and filters.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href="/homes-list">
                    <Button className="w-full">View List</Button>
                  </Link>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BarChart3 className="w-5 h-5 mr-2 text-purple-600" />
                    Dashboard
                  </CardTitle>
                  <CardDescription>
                    Access analytics, reports, and key metrics for your foster home program.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href="/dashboard">
                    <Button className="w-full">View Dashboard</Button>
                  </Link>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Users className="w-5 h-5 mr-2 text-orange-600" />
                    User Management
                  </CardTitle>
                  <CardDescription>Manage user accounts, roles, and permissions for your team members.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href="/admin/users">
                    <Button className="w-full">Manage Users</Button>
                  </Link>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Shield className="w-5 h-5 mr-2 text-red-600" />
                    Admin Panel
                  </CardTitle>
                  <CardDescription>Access administrative functions and system configuration options.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href="/admin">
                    <Button className="w-full">Admin Panel</Button>
                  </Link>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Clock className="w-5 h-5 mr-2 text-indigo-600" />
                    Recent Activity
                  </CardTitle>
                  <CardDescription>View recent visits, updates, and system activity across all homes.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full bg-transparent" variant="outline">
                    Coming Soon
                  </Button>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="text-center">
              <div className="max-w-md mx-auto">
                <Card>
                  <CardHeader>
                    <CardTitle>Welcome to Foster Home Visits</CardTitle>
                    <CardDescription>Please sign in to access the foster home management system.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 mb-4">
                      This platform helps you manage foster home visits, track compliance, and maintain detailed
                      records.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
