"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, Shield, Network, CheckCircle, XCircle, AlertTriangle, Zap, DollarSign, Clock } from "lucide-react"
import Link from "next/link"

export default function Solutions() {
  const solutions = [
    {
      id: "static-ip-proxy",
      title: "Static IP Proxy Service (Recommended)",
      description: "Route traffic through fixed IP addresses while keeping your Azure SQL database",
      difficulty: "Easy",
      cost: "$39/month",
      timeToImplement: "30 minutes",
      pros: [
        "Keep existing Azure SQL database",
        "Maintain HIPAA compliance",
        "No data migration required",
        "Works with existing integrations",
        "Predictable static IP addresses",
        "Easy setup with QuotaGuard/Fixie",
      ],
      cons: ["Monthly cost", "Slight latency increase", "Dependency on proxy service"],
      implementation: [
        "Sign up for QuotaGuard Static or similar service",
        "Get proxy URL credentials",
        "Add QUOTAGUARD_URL to Vercel environment variables",
        "Add proxy IPs to Azure SQL firewall",
        "Deploy and test connection",
      ],
      icon: Network,
      recommended: true,
    },
    {
      id: "azure-private-endpoint",
      title: "Azure Private Endpoint",
      description: "Keep Azure SQL but use private networking",
      difficulty: "Hard",
      cost: "$50-100/month",
      timeToImplement: "2-4 hours",
      pros: [
        "Keep existing Azure SQL",
        "Enterprise-grade security",
        "No public internet exposure",
        "Consistent IP addresses",
      ],
      cons: ["Complex setup", "Higher cost", "Requires VNet configuration", "May need Vercel Enterprise"],
      implementation: [
        "Create Azure VNet",
        "Set up Private Endpoint",
        "Configure DNS resolution",
        "Update Vercel networking",
        "Test connectivity",
      ],
      icon: Shield,
    },
    {
      id: "connection-proxy",
      title: "Self-Hosted Connection Proxy",
      description: "Set up your own proxy server with fixed IP addresses",
      difficulty: "Medium",
      cost: "$20-50/month",
      timeToImplement: "1-2 hours",
      pros: ["Full control over proxy", "Lower cost than managed services", "Custom configuration"],
      cons: ["Requires server management", "More complex setup", "Need to maintain proxy server"],
      implementation: [
        "Set up VPS with static IP",
        "Install and configure proxy software",
        "Configure Azure SQL to allow proxy IP",
        "Update connection strings",
        "Monitor and maintain server",
      ],
      icon: Network,
    },
    {
      id: "vercel-ip-ranges",
      title: "Whitelist All Vercel IPs",
      description: "Add all of Vercel's published IP ranges to firewall",
      difficulty: "Medium",
      cost: "Free",
      timeToImplement: "1 hour",
      pros: ["Keep existing setup", "No additional services", "Free solution"],
      cons: [
        "Large IP range (security concern)",
        "Need to update when Vercel changes IPs",
        "Not officially supported by Vercel",
        "Not recommended for HIPAA compliance",
      ],
      implementation: [
        "Get Vercel IP ranges",
        "Add all ranges to Azure SQL firewall",
        "Set up monitoring for IP changes",
        "Create update process",
      ],
      icon: Network,
      warning: "Not recommended for production/HIPAA",
    },
  ]

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Easy":
        return "bg-green-100 text-green-800"
      case "Medium":
        return "bg-yellow-100 text-yellow-800"
      case "Hard":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link href="/">
                <Button variant="ghost">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Home
                </Button>
              </Link>
              <div className="flex items-center space-x-2">
                <Network className="w-6 h-6 text-blue-600" />
                <span className="text-lg font-semibold text-gray-900">Connection Solutions</span>
              </div>
            </div>
            <Link href="/proxy-setup">
              <Button>
                <Network className="w-4 h-4 mr-2" />
                Setup Proxy
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Solutions for Vercel IP Rotation</h1>
            <p className="text-gray-600">
              Sustainable solutions that work with Vercel's rotating IP addresses while keeping your Azure SQL database
            </p>
          </div>

          {/* Problem Explanation */}
          <Alert className="mb-8">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>The Problem:</strong> Vercel functions use rotating IP addresses that change unpredictably. Since
              you need to maintain HIPAA compliance and keep your existing Azure SQL database with all its integrations,
              we need solutions that work with your current setup.
            </AlertDescription>
          </Alert>

          {/* Solutions Grid */}
          <div className="space-y-6">
            {solutions.map((solution) => {
              const Icon = solution.icon
              return (
                <Card
                  key={solution.id}
                  className={`${solution.recommended ? "ring-2 ring-blue-500 ring-opacity-50" : ""} ${
                    solution.warning ? "border-yellow-300" : ""
                  }`}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`p-3 rounded-lg ${solution.recommended ? "bg-blue-100" : "bg-gray-100"}`}>
                          <Icon className={`w-6 h-6 ${solution.recommended ? "text-blue-600" : "text-gray-600"}`} />
                        </div>
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            {solution.title}
                            {solution.recommended && <Badge className="bg-blue-100 text-blue-800">Recommended</Badge>}
                            {solution.warning && <Badge variant="destructive">Not Recommended</Badge>}
                          </CardTitle>
                          <CardDescription className="text-base">{solution.description}</CardDescription>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <div className="flex items-center space-x-2">
                        <Badge className={getDifficultyColor(solution.difficulty)}>{solution.difficulty}</Badge>
                        <span className="text-sm text-gray-600">Difficulty</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <DollarSign className="w-4 h-4 text-gray-500" />
                        <span className="text-sm">{solution.cost}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4 text-gray-500" />
                        <span className="text-sm">{solution.timeToImplement}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Pros */}
                      <div>
                        <h4 className="font-semibold text-green-700 mb-2 flex items-center">
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Pros
                        </h4>
                        <ul className="space-y-1">
                          {solution.pros.map((pro, index) => (
                            <li key={index} className="text-sm text-gray-600 flex items-start">
                              <span className="text-green-500 mr-2 mt-0.5">•</span>
                              {pro}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Cons */}
                      <div>
                        <h4 className="font-semibold text-red-700 mb-2 flex items-center">
                          <XCircle className="w-4 h-4 mr-1" />
                          Cons
                        </h4>
                        <ul className="space-y-1">
                          {solution.cons.map((con, index) => (
                            <li key={index} className="text-sm text-gray-600 flex items-start">
                              <span className="text-red-500 mr-2 mt-0.5">•</span>
                              {con}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Implementation Steps */}
                    <div className="mt-6">
                      <h4 className="font-semibold text-gray-900 mb-2">Implementation Steps</h4>
                      <ol className="space-y-1">
                        {solution.implementation.map((step, index) => (
                          <li key={index} className="text-sm text-gray-600 flex items-start">
                            <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full mr-3 mt-0.5">
                              {index + 1}
                            </span>
                            {step}
                          </li>
                        ))}
                      </ol>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Recommendation */}
          <Card className="mt-8 bg-blue-50 border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center text-blue-900">
                <Zap className="w-5 h-5 mr-2" />
                My Recommendation for Your Situation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-blue-800 mb-4">
                Given your HIPAA requirements and existing Azure SQL integrations, I strongly recommend the{" "}
                <strong>Static IP Proxy Service</strong> approach. Here's why:
              </p>
              <ul className="space-y-2 text-blue-700">
                <li className="flex items-start">
                  <CheckCircle className="w-4 h-4 text-blue-600 mr-2 mt-0.5" />
                  <span>
                    <strong>Keep everything as-is:</strong> No database migration or integration changes needed
                  </span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-4 h-4 text-blue-600 mr-2 mt-0.5" />
                  <span>
                    <strong>HIPAA compliant:</strong> Services like QuotaGuard are used by healthcare companies
                  </span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-4 h-4 text-blue-600 mr-2 mt-0.5" />
                  <span>
                    <strong>Quick setup:</strong> Can be implemented in 30 minutes
                  </span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-4 h-4 text-blue-600 mr-2 mt-0.5" />
                  <span>
                    <strong>Predictable cost:</strong> $39/month is reasonable for enterprise applications
                  </span>
                </li>
              </ul>
              <div className="mt-4">
                <Link href="/proxy-setup">
                  <Button>
                    <Network className="w-4 h-4 mr-2" />
                    Set Up Static IP Proxy
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
