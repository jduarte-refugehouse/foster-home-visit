"use client"

import { useUser } from "@clerk/nextjs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Mail, Phone, MapPin, Clock, Users, MessageSquare, ArrowLeft, Lock } from "lucide-react"
import Link from "next/link"

export default function ContactPage() {
  const { isSignedIn, isLoaded } = useUser()

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
          <div className="text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!isSignedIn) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
          <Card className="w-full max-w-md">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Lock className="h-12 w-12 text-gray-400 mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Authentication Required</h2>
              <p className="text-gray-600 text-center mb-6">You need to be signed in to access contact information.</p>
              <Link href="/">
                <Button>Go to Home</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/" className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
          <div className="flex items-center gap-2">
            <MessageSquare className="h-6 w-6 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Contact Information</h1>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Main Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                Foster Care Department
              </CardTitle>
              <CardDescription>Primary contact for foster home visits and assessments</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="font-medium">(555) 123-4567</p>
                  <p className="text-sm text-gray-600">Main office line</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="font-medium">foster.care@refugehouse.org</p>
                  <p className="text-sm text-gray-600">General inquiries</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-gray-400 mt-1" />
                <div>
                  <p className="font-medium">123 Care Street</p>
                  <p className="text-gray-600">Tallahassee, FL 32301</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-gray-400 mt-1" />
                <div>
                  <p className="font-medium">Office Hours</p>
                  <p className="text-sm text-gray-600">Monday - Friday: 8:00 AM - 5:00 PM</p>
                  <p className="text-sm text-gray-600">Saturday: 9:00 AM - 1:00 PM</p>
                  <p className="text-sm text-gray-600">Sunday: Closed</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Emergency Contact */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5 text-red-600" />
                Emergency Contact
                <Badge variant="destructive" className="ml-2">
                  24/7
                </Badge>
              </CardTitle>
              <CardDescription>For urgent situations requiring immediate attention</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-red-500" />
                <div>
                  <p className="font-medium text-red-600">(555) 911-HELP</p>
                  <p className="text-sm text-gray-600">Emergency hotline</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-red-500" />
                <div>
                  <p className="font-medium text-red-600">emergency@refugehouse.org</p>
                  <p className="text-sm text-gray-600">Urgent email support</p>
                </div>
              </div>

              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-800">
                  <strong>When to call:</strong> Child safety concerns, medical emergencies, or situations requiring
                  immediate intervention.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Department Contacts */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Department Contacts</CardTitle>
              <CardDescription>Specific contacts for different services and departments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900">Home Assessment Team</h4>
                    <p className="text-sm text-gray-600">assessments@refugehouse.org</p>
                    <p className="text-sm text-gray-600">(555) 123-4568</p>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900">Family Support Services</h4>
                    <p className="text-sm text-gray-600">support@refugehouse.org</p>
                    <p className="text-sm text-gray-600">(555) 123-4569</p>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900">Training & Resources</h4>
                    <p className="text-sm text-gray-600">training@refugehouse.org</p>
                    <p className="text-sm text-gray-600">(555) 123-4570</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900">Administrative Office</h4>
                    <p className="text-sm text-gray-600">admin@refugehouse.org</p>
                    <p className="text-sm text-gray-600">(555) 123-4571</p>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900">IT Support</h4>
                    <p className="text-sm text-gray-600">it.support@refugehouse.org</p>
                    <p className="text-sm text-gray-600">(555) 123-4572</p>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900">Director's Office</h4>
                    <p className="text-sm text-gray-600">director@refugehouse.org</p>
                    <p className="text-sm text-gray-600">(555) 123-4573</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common tasks and helpful resources</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                <Link href="/dashboard" prefetch={false}>
                  <Button variant="outline">
                    <Users className="mr-2 h-4 w-4" />
                    View Dashboard
                  </Button>
                </Link>
                <Link href="/homes-map" prefetch={false}>
                  <Button variant="outline">
                    <MapPin className="mr-2 h-4 w-4" />
                    Homes Map
                  </Button>
                </Link>
                <Link href="/admin" prefetch={false}>
                  <Button variant="outline">
                    <Users className="mr-2 h-4 w-4" />
                    Admin Panel
                  </Button>
                </Link>
                <Link href="/diagnostics" prefetch={false}>
                  <Button variant="outline">
                    <MessageSquare className="mr-2 h-4 w-4" />
                    System Status
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
