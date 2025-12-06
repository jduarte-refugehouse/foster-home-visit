"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@refugehouse/shared-core/components/ui/card"
import { Badge } from "@refugehouse/shared-core/components/ui/badge"
import { Button } from "@refugehouse/shared-core/components/ui/button"
import { Input } from "@refugehouse/shared-core/components/ui/input"
import { Search, Copy, CheckCircle, Key, Activity, BookOpen, ArrowRight, Info, Zap, Shield, Database, Link2 } from "lucide-react"
import { API_ENDPOINTS, getCategories } from "@refugehouse/api-config"
import type { ApiEndpoint } from "@refugehouse/api-config"
import Link from "next/link"
import { useUser } from "@clerk/nextjs"

interface ApiKeyStats {
  totalKeys: number
  activeKeys: number
  totalUsage: number
}

export default function ApisPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [copiedEndpoint, setCopiedEndpoint] = useState<string | null>(null)
  const [apiKeyStats, setApiKeyStats] = useState<ApiKeyStats | null>(null)
  const [loadingStats, setLoadingStats] = useState(true)
  const { user } = useUser()

  const categories = getCategories()

  const filteredEndpoints = API_ENDPOINTS.filter((endpoint) => {
    const matchesSearch =
      endpoint.path.toLowerCase().includes(searchTerm.toLowerCase()) ||
      endpoint.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      endpoint.category.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesCategory =
      selectedCategory === "all" || endpoint.category === selectedCategory

    return matchesSearch && matchesCategory
  })

  // Fetch API key stats
  useEffect(() => {
    async function fetchStats() {
      try {
        const headers: HeadersInit = {
          "Content-Type": "application/json",
        }

        if (user) {
          headers["x-user-clerk-id"] = user.id
          headers["x-user-email"] = user.primaryEmailAddress?.emailAddress || ""
          headers["x-user-name"] = `${user.firstName || ""} ${user.lastName || ""}`.trim()
        }

        const response = await fetch("/api/admin/api-keys", {
          method: "GET",
          headers,
          credentials: "include",
        })

        if (response.ok) {
          const data = await response.json()
          const keys = data.keys || data.apiKeys || []
          const activeKeys = keys.filter((k: any) => k.is_active)
          const totalUsage = keys.reduce((sum: number, k: any) => sum + (k.usage_count || 0), 0)

          setApiKeyStats({
            totalKeys: keys.length,
            activeKeys: activeKeys.length,
            totalUsage,
          })
        }
      } catch (error) {
        console.error("Failed to fetch API key stats:", error)
      } finally {
        setLoadingStats(false)
      }
    }

    fetchStats()
  }, [user])

  const copyToClipboard = (text: string, endpointPath: string) => {
    navigator.clipboard.writeText(text)
    setCopiedEndpoint(endpointPath)
    setTimeout(() => setCopiedEndpoint(null), 2000)
  }

  return (
    <div className="container mx-auto p-6 space-y-6 max-w-7xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Radius API Hub</h1>
        <p className="text-muted-foreground">
          Centralized API gateway for accessing RadiusBifrost data across all microservices
        </p>
      </div>

      {/* Explainer/Overview Section */}
      <Card className="border-2 border-refuge-purple/20">
        <CardHeader className="bg-gradient-to-r from-refuge-purple to-refuge-magenta text-white rounded-t-lg">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-white/20 rounded-lg">
              <Info className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-white text-2xl mb-2">What is the Radius API Hub?</CardTitle>
              <CardDescription className="text-white/90">
                A centralized API gateway that provides secure, authenticated access to RadiusBifrost data
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-refuge-purple/10 rounded-lg">
                  <Zap className="h-5 w-5 text-refuge-purple" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Why It Exists</h3>
                  <p className="text-sm text-muted-foreground">
                    Instead of purchasing static IP addresses ($100 each) for every microservice, we centralize all
                    RadiusBifrost access through this single hub. This saves costs and simplifies security management.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-2 bg-refuge-purple/10 rounded-lg">
                  <Shield className="h-5 w-5 text-refuge-purple" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">How It Works</h3>
                  <p className="text-sm text-muted-foreground">
                    Microservices authenticate using API keys, then access RadiusBifrost data through this hub. The hub
                    handles all database connections and IP whitelisting requirements.
                  </p>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-refuge-purple/10 rounded-lg">
                  <Database className="h-5 w-5 text-refuge-purple" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">What's Available</h3>
                  <p className="text-sm text-muted-foreground">
                    Access to homes, appointments, visit forms, users, and more from RadiusBifrost. All endpoints are
                    type-safe and documented.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-2 bg-refuge-purple/10 rounded-lg">
                  <Link2 className="h-5 w-5 text-refuge-purple" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Monorepo Benefits</h3>
                  <p className="text-sm text-muted-foreground">
                    Shared types, auto-complete, and instant updates across all microservices. Changes to API endpoints
                    are immediately available to all consumers.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Endpoints</p>
                <p className="text-2xl font-bold">{API_ENDPOINTS.length}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Activity className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Categories</p>
                <p className="text-2xl font-bold">{categories.length}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <BookOpen className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active API Keys</p>
                <p className="text-2xl font-bold">
                  {loadingStats ? "..." : apiKeyStats?.activeKeys ?? 0}
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <Key className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Requests</p>
                <p className="text-2xl font-bold">
                  {loadingStats ? "..." : apiKeyStats?.totalUsage.toLocaleString() ?? 0}
                </p>
              </div>
              <div className="p-3 bg-orange-100 rounded-lg">
                <Zap className="h-5 w-5 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Links */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Links</CardTitle>
          <CardDescription>Manage API keys, monitor health, and access documentation</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <Link href="/admin/apis/keys">
              <Button variant="outline" className="w-full justify-start">
                <Key className="h-4 w-4 mr-2" />
                Manage API Keys
                <ArrowRight className="h-4 w-4 ml-auto" />
              </Button>
            </Link>
            <Link href="/admin/apis/health">
              <Button variant="outline" className="w-full justify-start">
                <Activity className="h-4 w-4 mr-2" />
                Health Monitoring
                <ArrowRight className="h-4 w-4 ml-auto" />
              </Button>
            </Link>
            <div className="flex items-center justify-center p-4 border rounded-lg bg-muted/50">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <BookOpen className="h-4 w-4" />
                <span>Documentation available in <code className="text-xs">docs/radius-api-hub.md</code></span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary of What's Developed */}
      <Card>
        <CardHeader>
          <CardTitle>What's Been Developed</CardTitle>
          <CardDescription>
            Complete overview of all available API endpoints and their capabilities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {categories.map((category) => {
              const categoryEndpoints = API_ENDPOINTS.filter((e) => e.category === category)
              return (
                <div key={category} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-lg">{category}</h3>
                    <Badge>{categoryEndpoints.length} endpoint{categoryEndpoints.length !== 1 ? "s" : ""}</Badge>
                  </div>
                  <div className="space-y-2">
                    {categoryEndpoints.map((endpoint) => (
                      <div key={endpoint.path} className="flex items-start gap-3 text-sm">
                        <code className="bg-muted px-2 py-1 rounded font-mono text-xs mt-0.5">
                          {endpoint.method}
                        </code>
                        <div className="flex-1">
                          <code className="text-refuge-purple font-semibold">{endpoint.path}</code>
                          <p className="text-muted-foreground mt-1">{endpoint.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Getting Started Guide */}
      <Card className="bg-gradient-to-br from-refuge-purple/5 to-refuge-magenta/5 border-refuge-purple/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-refuge-purple" />
            Getting Started
          </CardTitle>
          <CardDescription>Quick steps to start using the API Hub in your microservice</CardDescription>
        </CardHeader>
        <CardContent>
          <ol className="space-y-3 list-decimal list-inside">
            <li className="text-sm">
              <strong>Create an API Key:</strong> Go to{" "}
              <Link href="/admin/apis/keys" className="text-refuge-purple hover:underline">
                API Key Management
              </Link>{" "}
              and create a key for your microservice
            </li>
            <li className="text-sm">
              <strong>Install the Client:</strong> Import the type-safe API client in your microservice:
              <code className="block bg-muted p-2 rounded mt-2 text-xs">
                import {"{"} radiusApiClient {"}"} from "@refugehouse/radius-api-client"
              </code>
            </li>
            <li className="text-sm">
              <strong>Set Environment Variable:</strong> Add your API key to your Vercel project settings:
              <code className="block bg-muted p-2 rounded mt-2 text-xs">RADIUS_API_KEY=your-api-key-here</code>
            </li>
            <li className="text-sm">
              <strong>Start Using:</strong> Call API methods with full type safety and autocomplete:
              <code className="block bg-muted p-2 rounded mt-2 text-xs">
                const homes = await radiusApiClient.getHomes({"{"} unit: "RAD" {"}"})
              </code>
            </li>
          </ol>
        </CardContent>
      </Card>

      {/* API Catalog Section */}
      <div>
        <h2 className="text-2xl font-bold mb-4">API Catalog</h2>
        <p className="text-muted-foreground mb-6">
          Browse and explore all available API endpoints for accessing RadiusBifrost data
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Search & Filter</CardTitle>
          <CardDescription>Find API endpoints by name, description, or category</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search endpoints..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedCategory === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory("all")}
            >
              All ({API_ENDPOINTS.length})
            </Button>
            {categories.map((category) => {
              const count = API_ENDPOINTS.filter((e) => e.category === category).length
              return (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                >
                  {category} ({count})
                </Button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6">
        {filteredEndpoints.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">
                No endpoints found matching your search criteria
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredEndpoints.map((endpoint) => (
            <EndpointCard
              key={endpoint.path}
              endpoint={endpoint}
              copiedEndpoint={copiedEndpoint}
              onCopy={copyToClipboard}
            />
          ))
        )}
      </div>
    </div>
  )
}

function EndpointCard({
  endpoint,
  copiedEndpoint,
  onCopy,
}: {
  endpoint: ApiEndpoint
  copiedEndpoint: string | null
  onCopy: (text: string, path: string) => void
}) {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL || "https://admin.refugehouse.app"
  const fullUrl = `${baseUrl}${endpoint.path}`

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <CardTitle className="text-xl">{endpoint.path}</CardTitle>
              <Badge variant="outline">{endpoint.method}</Badge>
              <Badge>{endpoint.category}</Badge>
            </div>
            <CardDescription>{endpoint.description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {endpoint.parameters && endpoint.parameters.length > 0 && (
          <div>
            <h4 className="font-semibold mb-2">Parameters</h4>
            <div className="space-y-2">
              {endpoint.parameters.map((param) => (
                <div key={param.name} className="flex items-start gap-2 text-sm">
                  <code className="bg-muted px-2 py-1 rounded font-mono text-xs">
                    {param.name}
                  </code>
                  <span className="text-muted-foreground">
                    ({param.type}) {param.required && <Badge variant="destructive" className="text-xs">Required</Badge>}
                  </span>
                  <span className="text-muted-foreground">- {param.description}</span>
                  {param.example && (
                    <span className="text-muted-foreground text-xs">
                      Example: {String(param.example)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div>
          <h4 className="font-semibold mb-2">Response Type</h4>
          <code className="bg-muted px-2 py-1 rounded font-mono text-sm">
            {endpoint.responseType}
          </code>
        </div>

        {endpoint.exampleRequest && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold">Example Request</h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onCopy(fullUrl, endpoint.path)}
              >
                {copiedEndpoint === endpoint.path ? (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy URL
                  </>
                )}
              </Button>
            </div>
            <div className="bg-muted p-4 rounded-lg">
              <code className="text-sm">{fullUrl}</code>
              {endpoint.exampleRequest.url?.includes("?") && (
                <div className="mt-2 text-sm text-muted-foreground">
                  Query string: <code>{endpoint.exampleRequest.url.split("?")[1]}</code>
                </div>
              )}
            </div>
          </div>
        )}

        {endpoint.exampleResponse && (
          <div>
            <h4 className="font-semibold mb-2">Example Response</h4>
            <div className="bg-muted p-4 rounded-lg overflow-x-auto">
              <pre className="text-sm">
                <code>{JSON.stringify(endpoint.exampleResponse, null, 2)}</code>
              </pre>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

