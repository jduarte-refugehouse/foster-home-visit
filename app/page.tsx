import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Shield,
  Calendar,
  FileText,
  Upload,
  Users,
  CheckCircle,
  Clock,
  Database,
  Lock,
  Award,
  ArrowRight,
} from "lucide-react"

export default function Home() {
  const features = [
    {
      icon: Shield,
      title: "TAC Chapter 749 Compliant",
      description: "Built-in compliance tracking for Texas minimum standards with automated prompts and validation.",
      highlight: true,
    },
    {
      icon: Calendar,
      title: "Smart Visit Scheduling",
      description: "Intuitive calendar management with automated reminders and compliance deadline tracking.",
    },
    {
      icon: FileText,
      title: "Comprehensive Documentation",
      description: "Detailed visit forms with TAC/RCC compliance prompts, digital signatures, and PDF export.",
    },
    {
      icon: Upload,
      title: "Radius Integration",
      description: "Seamless XML data import from Radius system for families, placements, and case information.",
    },
    {
      icon: Users,
      title: "Family Management",
      description: "Complete family and placement tracking with visit history and compliance status monitoring.",
    },
    {
      icon: Database,
      title: "Secure Azure Integration",
      description: "Enterprise-grade security with Azure SQL, Key Vault, and encrypted data storage.",
    },
  ]

  const benefits = [
    {
      icon: Clock,
      title: "Save 3+ Hours Weekly",
      description: "Automated compliance tracking and streamlined documentation reduce administrative overhead.",
    },
    {
      icon: CheckCircle,
      title: "100% Compliance Ready",
      description: "Never miss a compliance requirement with built-in TAC Chapter 749 and RCC contract prompts.",
    },
    {
      icon: Lock,
      title: "Enterprise Security",
      description: "HIPAA-compliant data handling with Azure security and role-based access controls.",
    },
    {
      icon: Award,
      title: "Audit-Ready Reports",
      description: "Generate comprehensive reports for state inspections and contract compliance reviews.",
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <Shield className="w-8 h-8 text-blue-600" />
              <span className="text-xl font-bold text-gray-900">Family Visits Pro</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/sign-in">
                <Button variant="ghost">Sign In</Button>
              </Link>
              <Link href="/sign-up">
                <Button>Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-20 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <Badge className="mb-4 bg-blue-100 text-blue-800 hover:bg-blue-100">TAC Chapter 749 Certified</Badge>
            <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl md:text-6xl">
              Family Visit Management
              <span className="block text-blue-600">Made Simple & Compliant</span>
            </h1>
            <p className="mt-6 max-w-3xl mx-auto text-xl text-gray-600">
              The only case management system built specifically for Texas child welfare requirements. Streamline your
              family visits while ensuring 100% TAC Chapter 749 and RCC contract compliance.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/dashboard">
                <Button size="lg" className="w-full sm:w-auto">
                  View Dashboard Demo
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
              <Link href="/features">
                <Button variant="outline" size="lg" className="w-full sm:w-auto bg-transparent">
                  Explore Features
                </Button>
              </Link>
            </div>
            <p className="mt-4 text-sm text-gray-500">
              No credit card required • 30-day free trial • Setup in under 5 minutes
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Everything You Need for Compliance</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Built by child welfare professionals, for child welfare professionals. Every feature designed with TAC
              Chapter 749 requirements in mind.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature) => {
              const Icon = feature.icon
              return (
                <Card
                  key={feature.title}
                  className={`hover:shadow-lg transition-shadow ${
                    feature.highlight ? "ring-2 ring-blue-500 ring-opacity-50" : ""
                  }`}
                >
                  <CardHeader>
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${feature.highlight ? "bg-blue-100" : "bg-gray-100"}`}>
                        <Icon className={`w-6 h-6 ${feature.highlight ? "text-blue-600" : "text-gray-600"}`} />
                      </div>
                      <CardTitle className="text-lg">{feature.title}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base leading-relaxed">{feature.description}</CardDescription>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Why Caseworkers Choose Family Visits Pro</h2>
            <p className="text-xl text-gray-600">
              Join hundreds of Texas caseworkers who've streamlined their workflow
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit) => {
              const Icon = benefit.icon
              return (
                <div key={benefit.title} className="text-center">
                  <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                    <Icon className="w-8 h-8 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{benefit.title}</h3>
                  <p className="text-gray-600">{benefit.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-indigo-700">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to Streamline Your Family Visits?</h2>
          <p className="text-xl text-blue-100 mb-8">
            Join hundreds of Texas caseworkers who've already made the switch to compliant, efficient family visit
            management.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/dashboard">
              <Button size="lg" variant="secondary" className="w-full sm:w-auto">
                Try Demo Dashboard
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
            <Link href="/features">
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto bg-transparent border-white text-white hover:bg-white hover:text-blue-600"
              >
                Learn More
              </Button>
            </Link>
          </div>
          <p className="mt-4 text-blue-100 text-sm">30-day free trial • No setup fees • Cancel anytime</p>
        </div>
      </section>
    </div>
  )
}
