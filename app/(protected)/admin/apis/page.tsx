"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@refugehouse/shared-core/components/ui/card"
import { Badge } from "@refugehouse/shared-core/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@refugehouse/shared-core/components/ui/tabs"
import { Button } from "@refugehouse/shared-core/components/ui/button"
import { Input } from "@refugehouse/shared-core/components/ui/input"
import { Search, Code, ExternalLink, Copy, CheckCircle } from "lucide-react"
import { API_ENDPOINTS, getEndpointsByCategory, getCategories } from "@refugehouse/api-config"
import type { ApiEndpoint } from "@refugehouse/api-config"

export default function ApisPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [copiedEndpoint, setCopiedEndpoint] = useState<string | null>(null)

  const categories = getCategories()
  const endpointsByCategory = getEndpointsByCategory()

  const filteredEndpoints = API_ENDPOINTS.filter((endpoint) => {
    const matchesSearch =
      endpoint.path.toLowerCase().includes(searchTerm.toLowerCase()) ||
      endpoint.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      endpoint.category.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesCategory =
      selectedCategory === "all" || endpoint.category === selectedCategory

    return matchesSearch && matchesCategory
  })

  const copyToClipboard = (text: string, endpointPath: string) => {
    navigator.clipboard.writeText(text)
    setCopiedEndpoint(endpointPath)
    setTimeout(() => setCopiedEndpoint(null), 2000)
  }

  return (
    <div className="container mx-auto p-6 space-y-6 max-w-7xl">
      <div>
        <h1 className="text-3xl font-bold">API Catalog</h1>
        <p className="text-muted-foreground">
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

