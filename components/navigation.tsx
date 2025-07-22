"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Home, MapPin, List, Settings, Users, FileText, TestTube } from "lucide-react"

export function Navigation() {
  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <Home className="h-8 w-8 text-blue-600" />
              <span className="font-bold text-xl text-gray-900">Home Visits</span>
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Dashboard
              </Button>
            </Link>

            <Link href="/homes-map">
              <Button variant="ghost" size="sm">
                <MapPin className="h-4 w-4 mr-2" />
                Map
              </Button>
            </Link>

            <Link href="/homes-list">
              <Button variant="ghost" size="sm">
                <List className="h-4 w-4 mr-2" />
                Homes
              </Button>
            </Link>

            <Link href="/admin">
              <Button variant="ghost" size="sm">
                <Users className="h-4 w-4 mr-2" />
                Admin
              </Button>
            </Link>

            <Link href="/diagnostics">
              <Button variant="ghost" size="sm">
                <FileText className="h-4 w-4 mr-2" />
                Diagnostics
              </Button>
            </Link>

            <Link href="/auth-test">
              <Button
                variant="outline"
                size="sm"
                className="border-orange-200 text-orange-700 hover:bg-orange-50 bg-transparent"
              >
                <TestTube className="h-4 w-4 mr-2" />
                Test Auth
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}
