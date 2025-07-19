import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Shield, Calendar, FileText, Upload, Users, Database, ArrowLeft, CheckCircle } from "lucide-react"

export default function Features() {
  const features = [
    {
      icon: Shield,
      title: "TAC Chapter 749 Compliance",
      description: "Automated compliance tracking with built-in prompts for all minimum standards requirements.",
      benefits: [
        "Monthly visit frequency tracking",
        "Safety assessment documentation",
        "Child wellbeing evaluations",
        "Caregiver interaction assessments",
      ],
    },
    {
      icon: Calendar,
      title: "Smart Scheduling",
      description: "Intuitive calendar with automated reminders and compliance deadline tracking.",
      benefits: [
        "Drag-and-drop scheduling",
        "Automated reminder notifications",
        "Compliance deadline alerts",
        "Mobile calendar sync",
      ],
    },
    {
      icon: FileText,
      title: "Comprehensive Forms",
      description: "Detailed forms with compliance prompts, digital signatures, and PDF export capabilities.",
      benefits: [
        "TAC/RCC compliance prompts",
        "Digital signature capture",
        "PDF export and printing",
        "Offline form completion",
      ],
    },
    {
      icon: Upload,
      title: "Radius Integration",
      description: "Direct XML import from Radius system for families, placements, and case data.",
      benefits: [
        "One-click data import",
        "Automatic family matching",
        "Placement synchronization",
        "Case history preservation",
      ],
    },
    {
      icon: Users,
      title: "Family Management",
      description: "Complete family and placement tracking with visit history and status monitoring.",
      benefits: ["Family profile management", "Placement tracking", "Visit history timeline", "Status monitoring"],
    },
    {
      icon: Database,
      title: "Azure Security",
      description: "Enterprise-grade security with Azure SQL, Key Vault, and encrypted storage.",
      benefits: [
        "HIPAA compliant storage",
        "Encrypted data transmission",
        "Role-based access control",
        "Audit trail logging",
      ],
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center space-x-2">
              <Shield className="w-8 h-8 text-blue-600" />
              <span className="text-xl font-bold text-gray-900">Family Visits Pro</span>
            </Link>
            <div className="flex items-center space-x-4">
              <Link href="/">
                <Button variant="ghost">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Home
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button>View Demo</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-16 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Badge className="mb-4 bg-blue-100 text-blue-800 hover:bg-blue-100">Complete Feature Overview</Badge>
          <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl mb-6">
            Everything You Need for
            <span className="block text-blue-600">Compliant Case Management</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Discover all the features that make Family Visits Pro the leading choice for Texas child welfare
            professionals.
          </p>
        </div>
      </section>

      {/* Features Grid */}
      <section className="pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <Card key={index} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center space-x-3">
                      <div className="p-3 bg-blue-100 rounded-lg">
                        <Icon className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{feature.title}</CardTitle>
                        <CardDescription className="text-base">{feature.description}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {feature.benefits.map((benefit, benefitIndex) => (
                        <li key={benefitIndex} className="flex items-center text-sm">
                          <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                          <span>{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-indigo-700">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to Experience These Features?</h2>
          <p className="text-xl text-blue-100 mb-8">
            See how Family Visits Pro can transform your workflow with our interactive demo.
          </p>
          <Link href="/dashboard">
            <Button size="lg" variant="secondary">
              Try Demo Dashboard
              <ArrowLeft className="ml-2 w-4 h-4 rotate-180" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  )
}
