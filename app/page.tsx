import { Navigation } from "@/components/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Home, MapPin, List, Users, FileText, Settings } from "lucide-react"
import Link from "next/link"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <main className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Home Visits Management System</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Streamline your home inspection and visit management process with our comprehensive platform.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="h-5 w-5 mr-2 text-blue-600" />
                Dashboard
              </CardTitle>
              <CardDescription>View overview and manage your daily activities</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/dashboard">
                <Button className="w-full">Go to Dashboard</Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center">
                <MapPin className="h-5 w-5 mr-2 text-green-600" />
                Homes Map
              </CardTitle>
              <CardDescription>Interactive map view of all registered homes</CardDescription>
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
                <List className="h-5 w-5 mr-2 text-purple-600" />
                Homes List
              </CardTitle>
              <CardDescription>Detailed list view of all homes and their status</CardDescription>
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
                <Users className="h-5 w-5 mr-2 text-orange-600" />
                Administration
              </CardTitle>
              <CardDescription>User management and system administration</CardDescription>
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
                <FileText className="h-5 w-5 mr-2 text-red-600" />
                Diagnostics
              </CardTitle>
              <CardDescription>System health and diagnostic information</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/diagnostics">
                <Button className="w-full">View Diagnostics</Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Home className="h-5 w-5 mr-2 text-indigo-600" />
                Contact
              </CardTitle>
              <CardDescription>Get in touch with our support team</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/contact">
                <Button className="w-full">Contact Us</Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        <div className="bg-white rounded-lg shadow p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Real-time Tracking</h3>
              <p className="text-gray-600">
                Monitor home visits and inspections in real-time with live updates and notifications.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Interactive Maps</h3>
              <p className="text-gray-600">
                Visualize home locations on interactive maps with detailed information and status indicators.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Comprehensive Reports</h3>
              <p className="text-gray-600">
                Generate detailed reports and analytics to track performance and compliance.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">User Management</h3>
              <p className="text-gray-600">
                Manage user roles, permissions, and access levels with advanced administration tools.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
