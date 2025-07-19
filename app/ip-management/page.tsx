"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Copy,
  RefreshCw,
  CheckCircle,
  ArrowLeft,
  Terminal,
  Globe,
  AlertTriangle,
  Lightbulb,
  ExternalLink,
} from "lucide-react"
import Link from "next/link"

interface IPManagementResult {
  success: boolean
  currentIP: string
  timestamp: string
  azureCliCommands: string[]
  manualSteps: string[]
  message: string
  error?: string
}

export default function IPManagement() {
  const [result, setResult] = useState<IPManagementResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  const generateCommands = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/add-current-ip", { method: "POST" })
      const data = await response.json()
      setResult(data)
    } catch (error) {
      setResult({
        success: false,
        currentIP: "Unknown",
        timestamp: new Date().toISOString(),
        azureCliCommands: [],
        manualSteps: [],
        message: "Failed to generate commands",
        error: error instanceof Error ? error.message : "Unknown error",
      })
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  useEffect(() => {
    generateCommands()
  }, [])

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
                <Globe className="w-6 h-6 text-blue-600" />
                <span className="text-lg font-semibold text-gray-900">IP Management</span>
              </div>
            </div>
            <Button onClick={generateCommands} disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              {loading ? "Detecting..." : "Refresh IP"}
            </Button>
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Vercel IP Management for Azure SQL</h1>
            <p className="text-gray-600">Add current Vercel IP to Azure SQL firewall rules</p>
          </div>

          {loading && (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <div className="text-center">
                  <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
                  <p className="text-gray-600">Detecting current IP address...</p>
                </div>
              </CardContent>
            </Card>
          )}

          {result && !loading && (
            <div className="space-y-6">
              {/* Current IP Status */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center">
                      <Globe className="w-5 h-5 mr-2" />
                      Current Vercel IP Address
                    </CardTitle>
                    <Badge variant="outline">{new Date(result.timestamp).toLocaleTimeString()}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <div className="text-3xl font-mono bg-gray-100 p-4 rounded-lg mb-4">{result.currentIP}</div>
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        This IP address needs to be added to your Azure SQL Server firewall rules to allow connections.
                      </AlertDescription>
                    </Alert>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Fix - Azure Portal */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Lightbulb className="w-5 h-5 mr-2" />
                    Quick Fix - Azure Portal (Recommended)
                  </CardTitle>
                  <CardDescription>Fastest way to add the IP address through Azure Portal</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {result.manualSteps.map((step, index) => (
                      <div key={index} className="flex items-start">
                        <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full mr-3 mt-0.5">
                          {index + 1}
                        </span>
                        <span className="text-sm">{step}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>Direct Link:</strong>{" "}
                      <a
                        href="https://portal.azure.com/#@/resource/subscriptions/your-subscription/resourceGroups/your-resource-group/providers/Microsoft.Sql/servers/refugehouse-bifrost-server/networking"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline hover:no-underline inline-flex items-center"
                      >
                        Open Azure SQL Networking Settings
                        <ExternalLink className="w-3 h-3 ml-1" />
                      </a>
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Azure CLI Commands */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center">
                        <Terminal className="w-5 h-5 mr-2" />
                        Azure CLI Commands
                      </CardTitle>
                      <CardDescription>For automated deployment or scripting</CardDescription>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(result.azureCliCommands.join("\n"))}
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      {copied ? "Copied!" : "Copy"}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto text-sm">
                    {result.azureCliCommands.join("\n")}
                  </pre>
                  <Alert className="mt-4">
                    <Terminal className="h-4 w-4" />
                    <AlertDescription>
                      Make sure to replace "your-resource-group" with your actual Azure resource group name.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>

              {/* Long-term Solutions */}
              <Card>
                <CardHeader>
                  <CardTitle>Long-term Solutions for Vercel IP Rotation</CardTitle>
                  <CardDescription>Consider these approaches for production deployments</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="border-l-4 border-blue-500 pl-4">
                      <h4 className="font-semibold text-gray-900">Option 1: Azure Private Endpoints</h4>
                      <p className="text-sm text-gray-600">
                        Use Azure Private Link to connect to your SQL database through Azure's private network.
                      </p>
                    </div>
                    <div className="border-l-4 border-green-500 pl-4">
                      <h4 className="font-semibold text-gray-900">Option 2: Connection Pooling Service</h4>
                      <p className="text-sm text-gray-600">
                        Use a service like PlanetScale, Supabase, or Azure SQL Database serverless with connection
                        pooling.
                      </p>
                    </div>
                    <div className="border-l-4 border-yellow-500 pl-4">
                      <h4 className="font-semibold text-gray-900">Option 3: Vercel IP Ranges</h4>
                      <p className="text-sm text-gray-600">
                        Whitelist all of Vercel's published IP ranges (requires periodic updates).
                      </p>
                    </div>
                    <div className="border-l-4 border-purple-500 pl-4">
                      <h4 className="font-semibold text-gray-900">Option 4: API Gateway</h4>
                      <p className="text-sm text-gray-600">
                        Use Azure API Management or similar service with fixed IP addresses.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Test Connection */}
              <Card>
                <CardHeader>
                  <CardTitle>Test Connection After Adding IP</CardTitle>
                  <CardDescription>Verify the connection works after updating firewall rules</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Link href="/test-db">
                      <Button>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Test Database Connection
                      </Button>
                    </Link>
                    <Link href="/diagnostics">
                      <Button variant="outline">
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Run Full Diagnostics
                      </Button>
                    </Link>
                  </div>
                  <Alert className="mt-4">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Important:</strong> After adding the IP to your firewall, wait 2-3 minutes for the changes
                      to take effect before testing the connection.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
