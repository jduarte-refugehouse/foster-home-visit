import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Calendar, Users, MapPin, Clock, CheckCircle } from "lucide-react"
import Image from "next/image"

const LOGO_SRC = "/images/web logo with name.png"

export default function Dashboard() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      {/* Header */}
      <header className="px-4 lg:px-6 h-14 flex items-center justify-between bg-white border-b border-gray-200">
        <Link className="flex items-center justify-center" href="/">
          <Image
            src={LOGO_SRC || "/placeholder.svg"}
            alt="Family Visits Pro Logo"
            width={180}
            height={36}
            className="h-auto"
          />
          <span className="sr-only">Family Visits Pro</span>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6">
          <Link className="text-sm font-medium hover:underline underline-offset-4 text-gray-600" href="/features">
            Features
          </Link>
          <Link className="text-sm font-medium hover:underline underline-offset-4 text-gray-600" href="/solutions">
            Solutions
          </Link>
          <Link className="text-sm font-medium hover:underline underline-offset-4 text-gray-600" href="/contact">
            Contact
          </Link>
          <Link className="text-sm font-medium hover:underline underline-offset-4 text-gray-600" href="/admin">
            Admin
          </Link>
        </nav>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-6">
        <div className="max-w-7xl mx-auto grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Welcome Card */}
          <Card className="lg:col-span-3 bg-gradient-to-r from-refuge-purple to-refuge-blue text-white">
            <CardHeader>
              <CardTitle className="text-3xl font-bold">Welcome to Your Dashboard!</CardTitle>
              <CardDescription className="text-refuge-purple-100">
                Quick overview of your family visit management system.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-lg">
                Here you can manage upcoming visits, view client information, and access important tools.
              </p>
            </CardContent>
          </Card>

          {/* Upcoming Visits */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Upcoming Visits</CardTitle>
              <Calendar className="w-4 h-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">5</div>
              <p className="text-xs text-gray-500">+2 scheduled for next week</p>
              <Button asChild variant="link" className="p-0 h-auto mt-2">
                <Link href="#">View all visits</Link>
              </Button>
            </CardContent>
          </Card>

          {/* Active Clients */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Active Clients</CardTitle>
              <Users className="w-4 h-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12</div>
              <p className="text-xs text-gray-500">+1 new client this month</p>
              <Button asChild variant="link" className="p-0 h-auto mt-2">
                <Link href="#">Manage clients</Link>
              </Button>
            </CardContent>
          </Card>

          {/* Average Visit Duration */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Avg. Visit Duration</CardTitle>
              <Clock className="w-4 h-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">1h 30m</div>
              <p className="text-xs text-gray-500">Consistent over last quarter</p>
              <Button asChild variant="link" className="p-0 h-auto mt-2">
                <Link href="#">View reports</Link>
              </Button>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="md:col-span-2 lg:col-span-1">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Perform common tasks quickly.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-2">
              <Button variant="outline" className="justify-start bg-transparent">
                <Calendar className="w-4 h-4 mr-2" /> Schedule New Visit
              </Button>
              <Button variant="outline" className="justify-start bg-transparent">
                <Users className="w-4 h-4 mr-2" /> Add New Client
              </Button>
              <Button variant="outline" className="justify-start bg-transparent">
                <MapPin className="w-4 h-4 mr-2" /> View Homes Map
              </Button>
            </CardContent>
          </Card>

          {/* System Status */}
          <Card>
            <CardHeader>
              <CardTitle>System Status</CardTitle>
              <CardDescription>Check the health of your connections.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Database Connection</span>
                <Badge className="bg-green-100 text-green-800">
                  <CheckCircle className="w-3 h-3 mr-1" /> Connected
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Proxy Status</span>
                <Badge className="bg-green-100 text-green-800">
                  <CheckCircle className="w-3 h-3 mr-1" /> Active
                </Badge>
              </div>
              <Button asChild variant="link" className="p-0 h-auto mt-2">
                <Link href="/diagnostics">Run Diagnostics</Link>
              </Button>
            </CardContent>
          </Card>

          {/* Important Links */}
          <Card>
            <CardHeader>
              <CardTitle>Important Links</CardTitle>
              <CardDescription>Access key configuration and data pages.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-2">
              <Button asChild variant="outline" className="justify-start bg-transparent">
                <Link href="/proxy-setup">
                  <MapPin className="w-4 h-4 mr-2" /> Proxy Setup
                </Link>
              </Button>
              <Button asChild variant="outline" className="justify-start bg-transparent">
                <Link href="/connection-recipe">
                  <MapPin className="w-4 h-4 mr-2" /> Connection Recipe
                </Link>
              </Button>
              <Button asChild variant="outline" className="justify-start bg-transparent">
                <Link href="/homes-map">
                  <MapPin className="w-4 h-4 mr-2" /> Homes Map
                </Link>
              </Button>
              <Button asChild variant="outline" className="justify-start bg-transparent">
                <Link href="/homes-list">
                  <MapPin className="w-4 h-4 mr-2" /> Homes List
                </Link>
              </Button>
              <Button asChild variant="outline" className="justify-start bg-transparent">
                <Link href="/coordinate-test">
                  <MapPin className="w-4 h-4 mr-2" /> Coordinate Test
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-4 lg:px-6 h-14 flex items-center justify-center bg-white border-t border-gray-200 text-sm text-gray-600">
        <p>&copy; 2024 Family Visits Pro. All rights reserved.</p>
      </footer>
    </div>
  )
}
