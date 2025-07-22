"use client"

import { useUser } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Home, Map, Users, Calendar, FileText, Shield, Heart, CheckCircle, Clock, AlertTriangle } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

export default function HomePage() {
  const { isSignedIn, isLoaded, user } = useUser()

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
          <div className="text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Hero Section */}
      <section className="relative py-20 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex justify-center mb-8">
            <Image
              src="/images/House Only.png"
              alt="Foster Home Visits"
              width={120}
              height={120}
              className="h-30 w-30"
            />
          </div>

          <h1 className="text-5xl font-bold text-gray-900 mb-6">Foster Home Visits</h1>

          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Internal application for managing foster home visits, assessments, and family connections. Streamline your
            workflow and keep track of all home visit activities.
          </p>

          {isSignedIn ? (
            <div className="space-y-4">
              <p className="text-lg text-gray-700">
                Welcome back, <span className="font-semibold">{user?.firstName}</span>!
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/dashboard" prefetch={false}>
                  <Button size="lg" className="w-full sm:w-auto">
                    <Home className="mr-2 h-5 w-5" />
                    Go to Dashboard
                  </Button>
                </Link>
                <Link href="/homes-map" prefetch={false}>
                  <Button variant="outline" size="lg" className="w-full sm:w-auto bg-transparent">
                    <Map className="mr-2 h-5 w-5" />
                    View Homes Map
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-lg text-gray-700 mb-6">Sign in to access your dashboard and manage home visits.</p>
            </div>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Application Features</h2>
            <p className="text-lg text-gray-600">Everything you need to manage foster home visits efficiently</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Map className="h-6 w-6 text-blue-600" />
                  </div>
                  <CardTitle>Interactive Map</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  View all foster homes on an interactive map with detailed location information and visit history.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Calendar className="h-6 w-6 text-green-600" />
                  </div>
                  <CardTitle>Visit Scheduling</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Schedule and track home visits, assessments, and follow-up appointments with families.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <FileText className="h-6 w-6 text-purple-600" />
                  </div>
                  <CardTitle>Report Management</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Generate and manage visit reports, assessments, and documentation for each home.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <Users className="h-6 w-6 text-orange-600" />
                  </div>
                  <CardTitle>Family Profiles</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Maintain detailed profiles for each foster family including contact information and history.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <Shield className="h-6 w-6 text-red-600" />
                  </div>
                  <CardTitle>Secure Access</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Role-based access control ensures sensitive information is only available to authorized staff.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-pink-100 rounded-lg">
                    <Heart className="h-6 w-6 text-pink-600" />
                  </div>
                  <CardTitle>Family Support</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Track support services, resources provided, and ongoing assistance for foster families.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Quick Stats Section */}
      {isSignedIn && (
        <section className="py-16 px-4 bg-gray-50">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Quick Overview</h2>
              <p className="text-lg text-gray-600">Current system status and recent activity</p>
            </div>

            <div className="grid md:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Active Homes</p>
                      <p className="text-2xl font-bold text-gray-900">127</p>
                    </div>
                    <Home className="h-8 w-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Pending Visits</p>
                      <p className="text-2xl font-bold text-gray-900">23</p>
                    </div>
                    <Clock className="h-8 w-8 text-orange-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Completed This Month</p>
                      <p className="text-2xl font-bold text-gray-900">89</p>
                    </div>
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Overdue</p>
                      <p className="text-2xl font-bold text-gray-900">5</p>
                    </div>
                    <AlertTriangle className="h-8 w-8 text-red-600" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex justify-center mb-6">
            <Image
              src="/images/House Only.png"
              alt="Foster Home Visits"
              width={48}
              height={48}
              className="h-12 w-12 opacity-80"
            />
          </div>
          <p className="text-gray-400 mb-4">Foster Home Visits Application - Internal Use Only</p>
          <p className="text-sm text-gray-500">© 2024 Refuge House. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
