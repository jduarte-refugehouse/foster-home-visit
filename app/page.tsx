import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Shield, Calendar, FileText, Upload, Users, CheckCircle } from "lucide-react"

export default function Home() {
  const features = [
    {
      icon: Shield,
      title: "TAC Chapter 749 Compliant",
      description: "Built-in compliance tracking for Texas minimum standards",
    },
    {
      icon: Calendar,
      title: "Visit Scheduling",
      description: "Easy scheduling and calendar management for family visits",
    },
    {
      icon: FileText,
      title: "Comprehensive Forms",
      description: "Detailed visit forms with compliance prompts and validation",
    },
    {
      icon: Upload,
      title: "Data Import",
      description: "Import family and placement data directly from Radius XML files",
    },
    {
      icon: Users,
      title: "Case Management",
      description: "Track families, placements, and visit history in one place",
    },
    {
      icon: CheckCircle,
      title: "RCC Contract Ready",
      description: "Meets all RCC contract requirements for documentation",
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="pt-20 pb-16 text-center">
          <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl md:text-6xl">
            Family Visits
            <span className="block text-blue-600">Case Management</span>
          </h1>
          <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
            TAC Chapter 749 compliant case management system for tracking family visits and maintaining compliance with
            minimum standards.
          </p>
          <div className="mt-5 max-w-md mx-auto sm:flex sm:justify-center md:mt-8">
            <div className="rounded-md shadow">
              <Link href="/sign-in">
                <Button size="lg" className="w-full">
                  Get Started
                </Button>
              </Link>
            </div>
            <div className="mt-3 rounded-md shadow sm:mt-0 sm:ml-3">
              <Link href="/sign-up">
                <Button variant="outline" size="lg" className="w-full bg-transparent">
                  Sign Up
                </Button>
              </Link>
            </div>
          </div>
        </div>

        <div className="py-16">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900">Everything you need for compliance</h2>
            <p className="mt-4 text-lg text-gray-600">
              Streamline your case management with built-in compliance tracking
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => {
              const Icon = feature.icon
              return (
                <Card key={feature.title} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center">
                      <Icon className="w-8 h-8 text-blue-600" />
                      <CardTitle className="ml-3">{feature.title}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base">{feature.description}</CardDescription>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>

        <div className="py-16 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Ready to get started?</h2>
          <Link href="/sign-up">
            <Button size="lg">Create Your Account</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
