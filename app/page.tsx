"use client"

import type React from "react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Home, Map, Database, Users, CalendarDays, Info } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

const LOGO_SRC = "/images/web logo with name.png" // Ensure this path is correct and the image exists

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow-sm py-4 px-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Image
            src={LOGO_SRC || "/placeholder.svg"}
            alt="Application Logo"
            width={150}
            height={40}
            priority // Helps with initial loading and LCP
          />
        </div>
        <nav className="hidden md:flex items-center gap-6">
          <Link
            className="text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-50"
            href="/dashboard"
          >
            Dashboard
          </Link>
          <Link
            className="text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-50"
            href="/homes-list"
          >
            Homes
          </Link>
          <Link
            className="text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-50"
            href="/features"
          >
            Features
          </Link>
          <Link
            className="text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-50"
            href="/contact"
          >
            Contact
          </Link>
          <Link
            className="text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-50"
            href="/admin"
          >
            Admin
          </Link>
        </nav>
        <Button className="md:hidden bg-transparent" size="icon" variant="outline">
          <MenuIcon className="h-6 w-6" />
          <span className="sr-only">Toggle navigation</span>
        </Button>
      </header>

      <main className="flex-1 py-12 px-4 md:px-6 lg:py-24">
        <section className="container mx-auto text-center mb-12">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-gray-50 sm:text-5xl md:text-6xl">
            Welcome to the Home Visits Application
          </h1>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Your central hub for managing home visits, data, and administrative tasks.
          </p>
        </section>

        <section className="container mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="flex flex-col items-center p-6 text-center">
            <Home className="h-12 w-12 text-blue-500 mb-4" />
            <CardHeader>
              <CardTitle>Manage Homes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                View and manage all registered homes, including details and visit history.
              </p>
              <Link href="/homes-list">
                <Button variant="outline">View Homes</Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="flex flex-col items-center p-6 text-center">
            <Map className="h-12 w-12 text-green-500 mb-4" />
            <CardHeader>
              <CardTitle>Interactive Map</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Explore homes on an interactive map to visualize locations and plan routes.
              </p>
              <Link href="/homes-map">
                <Button variant="outline">Open Map</Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="flex flex-col items-center p-6 text-center">
            <CalendarDays className="h-12 w-12 text-purple-500 mb-4" />
            <CardHeader>
              <CardTitle>Schedule Visits</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Efficiently schedule and track upcoming home visits for your team.
              </p>
              <Link href="/schedule">
                <Button variant="outline">Go to Schedule</Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="flex flex-col items-center p-6 text-center">
            <Users className="h-12 w-12 text-yellow-500 mb-4" />
            <CardHeader>
              <CardTitle>User Management</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Administer user accounts, roles, and permissions within the application.
              </p>
              <Link href="/admin/users">
                <Button variant="outline">Manage Users</Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="flex flex-col items-center p-6 text-center">
            <Database className="h-12 w-12 text-red-500 mb-4" />
            <CardHeader>
              <CardTitle>Database Diagnostics</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Test and monitor your database connection and proxy setup.
              </p>
              <Link href="/diagnostics">
                <Button variant="outline">Run Diagnostics</Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="flex flex-col items-center p-6 text-center">
            <Info className="h-12 w-12 text-indigo-500 mb-4" />
            <CardHeader>
              <CardTitle>Proxy Setup</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Configure and verify your static IP proxy settings for secure connections.
              </p>
              <Link href="/proxy-setup">
                <Button variant="outline">Configure Proxy</Button>
              </Link>
            </CardContent>
          </Card>
        </section>
      </main>

      <footer className="bg-gray-100 dark:bg-gray-800 py-6 px-4 md:px-6 text-center text-gray-600 dark:text-gray-400">
        <p>&copy; 2024 Home Visits Application. All rights reserved.</p>
      </footer>
    </div>
  )
}

function MenuIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="4" x2="20" y1="12" y2="12" />
      <line x1="4" x2="20" y1="6" y2="6" />
      <line x1="4" x2="20" y1="18" y2="18" />
    </svg>
  )
}
