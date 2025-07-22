"use client"

import { useUser } from "@clerk/nextjs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Map,
  Calendar,
  FileText,
  Users,
  Shield,
  Bell,
  BarChart3,
  Search,
  Download,
  Settings,
  ArrowLeft,
  Lock,
  CheckCircle,
  Clock,
  AlertTriangle,
} from "lucide-react"
import Link from "next/link"

export default function FeaturesPage() {
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
              <p className="text-gray-600 text-center mb-6">You need to be signed in to view application features.</p>
              <Link href="/">
                <Button>Go to Home</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const features = [
    {
      icon: Map,
      title: "Interactive Home Map",
      description:
        "View all foster homes on an interactive map with detailed location information, visit history, and status indicators.",
      status: "Available",
      statusColor: "bg-green-100 text-green-800",
      benefits: [
        "Real-time location data",
        "Visit history tracking",
        "Route optimization",
        "Mobile-friendly interface",
      ],
    },
    {
      icon: Calendar,
      title: "Visit Scheduling",
      description: "Schedule, track, and manage home visits with automated reminders and calendar integration.",
      status: "Available",
      statusColor: "bg-green-100 text-green-800",
      benefits: ["Automated scheduling", "Email reminders", "Calendar sync", "Conflict detection"],
    },
    {
      icon: FileText,
      title: "Report Management",
      description:
        "Generate, store, and manage visit reports, assessments, and documentation with templates and workflows.",
      status: "Available",
      statusColor: "bg-green-100 text-green-800",
      benefits: ["Custom templates", "Digital signatures", "Version control", "Export options"],
    },
    {
      icon: Users,
      title: "Family Profiles",
      description: "Comprehensive family profiles with contact information, history, notes, and relationship tracking.",
      status: "Available",
      statusColor: "bg-green-100 text-green-800",
      benefits: ["Complete family history", "Contact management", "Notes and alerts", "Relationship mapping"],
    },
    {
      icon: BarChart3,
      title: "Analytics Dashboard",
      description: "Track performance metrics, visit statistics, and generate insights for program improvement.",
      status: "Available",
      statusColor: "bg-green-100 text-green-800",
      benefits: ["Performance metrics", "Custom reports", "Trend analysis", "Data visualization"],
    },
    {
      icon: Shield,
      title: "Security & Access Control",
      description: "Role-based access control with audit trails and secure data handling for sensitive information.",
      status: "Available",
      statusColor: "bg-green-100 text-green-800",
      benefits: ["Role-based access", "Audit logging", "Data encryption", "Compliance ready"],
    },
    {
      icon: Bell,
      title: "Notification System",
      description: "Automated notifications for upcoming visits, overdue reports, and important updates.",
      status: "In Development",
      statusColor: "bg-yellow-100 text-yellow-800",
      benefits: ["Email notifications", "SMS alerts", "In-app notifications", "Custom triggers"],
    },
    {
      icon: Search,
      title: "Advanced Search",
      description: "Powerful search capabilities across all data with filters, saved searches, and quick access.",
      status: "In Development",
      statusColor: "bg-yellow-100 text-yellow-800",
      benefits: ["Full-text search", "Advanced filters", "Saved searches", "Quick access"],
    },
    {
      icon: Download,
      title: "Data Export",
      description: "Export data in various formats for reporting, analysis, and integration with other systems.",
      status: "Planned",
      statusColor: "bg-blue-100 text-blue-800",
      benefits: ["Multiple formats", "Scheduled exports", "API integration", "Custom fields"],
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/" className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
          <div className="flex items-center gap-2">
            <Settings className="h-6 w-6 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Application Features</h1>
          </div>
        </div>

        <p className="text-lg text-gray-600 mb-12 max-w-3xl">
          Comprehensive tools for managing foster home visits, assessments, and family support services. Our application
          provides everything you need to streamline your workflow and improve outcomes.
        </p>

        {/* Feature Grid */}
        <div className="grid lg:grid-cols-2 gap-8 mb-12">
          {features.map((feature, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <feature.icon className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">{feature.title}</CardTitle>
                      <Badge className={feature.statusColor}>{feature.status}</Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base mb-4">{feature.description}</CardDescription>

                <div className="space-y-2">
                  <h4 className="font-medium text-gray-900">Key Benefits:</h4>
                  <ul className="space-y-1">
                    {feature.benefits.map((benefit, benefitIndex) => (
                      <li key={benefitIndex} className="flex items-center gap-2 text-sm text-gray-600">
                        <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                        {benefit}
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Status Legend */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Feature Status Legend</CardTitle>
            <CardDescription>Understanding the development status of each feature</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium">Available</p>
                  <p className="text-sm text-gray-600">Feature is fully implemented and ready to use</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-yellow-600" />
                <div>
                  <p className="font-medium">In Development</p>
                  <p className="text-sm text-gray-600">Feature is currently being developed</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="font-medium">Planned</p>
                  <p className="text-sm text-gray-600">Feature is planned for future development</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Get Started</CardTitle>
            <CardDescription>Jump into the application and start using these features</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <Link href="/dashboard" prefetch={false}>
                <Button>
                  <BarChart3 className="mr-2 h-4 w-4" />
                  View Dashboard
                </Button>
              </Link>
              <Link href="/homes-map" prefetch={false}>
                <Button variant="outline">
                  <Map className="mr-2 h-4 w-4" />
                  Explore Map
                </Button>
              </Link>
              <Link href="/homes-list" prefetch={false}>
                <Button variant="outline">
                  <Users className="mr-2 h-4 w-4" />
                  Browse Homes
                </Button>
              </Link>
              <Link href="/admin" prefetch={false}>
                <Button variant="outline">
                  <Shield className="mr-2 h-4 w-4" />
                  Admin Panel
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
