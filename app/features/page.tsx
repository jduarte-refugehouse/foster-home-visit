"use client"

import { useUser } from "@clerk/nextjs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, List, BarChart3, Users, Shield, Clock, CheckCircle, Calendar, FileText } from "lucide-react"

// Force dynamic rendering
export const dynamic = "force-dynamic"

export default function FeaturesPage() {
  const { isLoaded } = useUser()

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  const features = [
    {
      icon: MapPin,
      title: "Interactive Mapping",
      description:
        "View all foster homes on an interactive map with detailed location information and status indicators.",
      benefits: ["Real-time location tracking", "Geographic analytics", "Route optimization", "Proximity search"],
    },
    {
      icon: List,
      title: "Comprehensive Listings",
      description:
        "Browse detailed lists of all foster homes with comprehensive information and advanced filtering options.",
      benefits: ["Advanced search filters", "Sortable columns", "Export capabilities", "Bulk operations"],
    },
    {
      icon: BarChart3,
      title: "Analytics Dashboard",
      description: "Access powerful analytics, reports, and key metrics for your foster home program.",
      benefits: ["Real-time metrics", "Custom reports", "Data visualization", "Performance tracking"],
    },
    {
      icon: Users,
      title: "User Management",
      description: "Manage user accounts, roles, and permissions for your team members with granular control.",
      benefits: ["Role-based access", "Permission management", "User activity logs", "Team collaboration"],
    },
    {
      icon: Shield,
      title: "Security & Compliance",
      description: "Enterprise-grade security features to protect sensitive information and ensure compliance.",
      benefits: ["Data encryption", "Audit trails", "Compliance reporting", "Access controls"],
    },
    {
      icon: Calendar,
      title: "Visit Scheduling",
      description: "Schedule and track home visits with automated reminders and calendar integration.",
      benefits: ["Calendar sync", "Automated reminders", "Visit history", "Scheduling conflicts"],
    },
    {
      icon: FileText,
      title: "Document Management",
      description: "Store, organize, and manage all documents related to foster homes and visits.",
      benefits: ["Document storage", "Version control", "Digital signatures", "Template library"],
    },
    {
      icon: CheckCircle,
      title: "Compliance Tracking",
      description: "Track compliance requirements and ensure all homes meet necessary standards.",
      benefits: ["Compliance checklists", "Automated alerts", "Status tracking", "Reporting tools"],
    },
  ]

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="text-center space-y-4">
        <Badge variant="secondary" className="px-4 py-2">
          Platform Features
        </Badge>
        <h1 className="text-4xl font-bold">Everything you need to manage foster homes</h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Our comprehensive platform provides all the tools and features you need to effectively manage foster home
          visits, track compliance, and support families.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {features.map((feature, index) => (
          <Card key={index} className="h-full">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>{feature.title}</CardTitle>
              </div>
              <CardDescription className="text-base">{feature.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {feature.benefits.map((benefit, benefitIndex) => (
                  <li key={benefitIndex} className="flex items-center space-x-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="bg-muted/50 rounded-lg p-8 text-center">
        <h2 className="text-2xl font-bold mb-4">Ready to get started?</h2>
        <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
          Join thousands of organizations already using our platform to improve their foster home management processes.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Badge variant="outline" className="px-4 py-2">
            <Clock className="w-4 h-4 mr-2" />
            24/7 Support
          </Badge>
          <Badge variant="outline" className="px-4 py-2">
            <Shield className="w-4 h-4 mr-2" />
            Enterprise Security
          </Badge>
          <Badge variant="outline" className="px-4 py-2">
            <CheckCircle className="w-4 h-4 mr-2" />
            99.9% Uptime
          </Badge>
        </div>
      </div>
    </div>
  )
}
