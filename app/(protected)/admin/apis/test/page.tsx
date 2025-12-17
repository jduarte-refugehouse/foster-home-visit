"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@refugehouse/shared-core/components/ui/card"
import { Button } from "@refugehouse/shared-core/components/ui/button"
import { Input } from "@refugehouse/shared-core/components/ui/input"
import { Label } from "@refugehouse/shared-core/components/ui/label"
import { Textarea } from "@refugehouse/shared-core/components/ui/textarea"
import { Badge } from "@refugehouse/shared-core/components/ui/badge"
import { Alert, AlertDescription } from "@refugehouse/shared-core/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@refugehouse/shared-core/components/ui/tabs"
import { Loader2, CheckCircle, XCircle, Copy, TestTube } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function ApiTestPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<Record<string, any>>({})

  // User Lookup
  const [lookupEmail, setLookupEmail] = useState("")
  const [lookupClerkId, setLookupClerkId] = useState("")
  const [lookupMicroservice, setLookupMicroservice] = useState("home-visits")

  // User Create
  const [createClerkId, setCreateClerkId] = useState("")
  const [createEmail, setCreateEmail] = useState("")
  const [createFirstName, setCreateFirstName] = useState("")
  const [createLastName, setCreateLastName] = useState("")
  const [createMicroservice, setCreateMicroservice] = useState("home-visits")

  // Permissions
  const [permUserId, setPermUserId] = useState("")
  const [permMicroservice, setPermMicroservice] = useState("home-visits")

  // Navigation
  const [navUserId, setNavUserId] = useState("")
  const [navMicroservice, setNavMicroservice] = useState("home-visits")

  const testEndpoint = async (
    endpoint: string,
    method: "GET" | "POST",
    params?: Record<string, any>,
    body?: any
  ) => {
    setLoading(true)
    try {
      // Use the proxy endpoint that handles API key authentication
      const response = await fetch("/api/admin/test-radius-api", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          endpoint,
          method,
          params,
          requestBody: body,
        }),
      })

      const data = await response.json()
      setResults((prev) => ({ ...prev, [endpoint]: { response: data.result || data, status: response.status, error: data.error } }))

      if (response.ok && data.success) {
        toast({
          title: "Success",
          description: `${endpoint} returned successfully`,
        })
      } else {
        toast({
          title: "Error",
          description: data.error || data.details || "Request failed",
          variant: "destructive",
        })
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error"
      setResults((prev) => ({ ...prev, [endpoint]: { error: errorMessage } }))
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copied",
      description: "Response copied to clipboard",
    })
  }

  return (
    <div className="container mx-auto p-6 space-y-6 max-w-6xl">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <TestTube className="h-8 w-8" />
          API Endpoint Testing
        </h1>
        <p className="text-muted-foreground">
          Test the Phase 1 Radius API Hub endpoints. Note: These tests use your current session authentication.
        </p>
      </div>

      <Alert>
        <AlertDescription>
          <strong>Note:</strong> These endpoints require API key authentication. The tests use server-side authentication
          from your current session. For external testing, use the API key from{" "}
          <code className="bg-muted px-1 rounded">/admin/apis/keys</code>
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="user-lookup" className="space-y-4">
        <TabsList>
          <TabsTrigger value="user-lookup">User Lookup</TabsTrigger>
          <TabsTrigger value="user-create">User Create</TabsTrigger>
          <TabsTrigger value="permissions">Permissions</TabsTrigger>
          <TabsTrigger value="navigation">Navigation</TabsTrigger>
        </TabsList>

        {/* User Lookup */}
        <TabsContent value="user-lookup" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>GET /api/radius/auth/user-lookup</CardTitle>
              <CardDescription>Look up a user by email or Clerk user ID</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="lookup-email">Email</Label>
                  <Input
                    id="lookup-email"
                    placeholder="user@refugehouse.org"
                    value={lookupEmail}
                    onChange={(e) => setLookupEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lookup-clerk-id">Clerk User ID</Label>
                  <Input
                    id="lookup-clerk-id"
                    placeholder="user_abc123"
                    value={lookupClerkId}
                    onChange={(e) => setLookupClerkId(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="lookup-microservice">Microservice Code</Label>
                <Input
                  id="lookup-microservice"
                  placeholder="home-visits"
                  value={lookupMicroservice}
                  onChange={(e) => setLookupMicroservice(e.target.value)}
                />
              </div>
              <Button
                onClick={() =>
                  testEndpoint("auth/user-lookup", "GET", {
                    email: lookupEmail,
                    clerkUserId: lookupClerkId,
                    microserviceCode: lookupMicroservice,
                  })
                }
                disabled={loading || (!lookupEmail && !lookupClerkId)}
              >
                {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                Test User Lookup
              </Button>
              {results["auth/user-lookup"] && (
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge variant={results["auth/user-lookup"].status === 200 ? "default" : "destructive"}>
                      {results["auth/user-lookup"].status === 200 ? (
                        <CheckCircle className="h-3 w-3 mr-1" />
                      ) : (
                        <XCircle className="h-3 w-3 mr-1" />
                      )}
                      Status: {results["auth/user-lookup"].status || "Error"}
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(JSON.stringify(results["auth/user-lookup"].response, null, 2))}
                    >
                      <Copy className="h-3 w-3 mr-1" />
                      Copy
                    </Button>
                  </div>
                  <Textarea
                    readOnly
                    value={JSON.stringify(results["auth/user-lookup"].response || results["auth/user-lookup"].error, null, 2)}
                    className="font-mono text-xs min-h-[200px]"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* User Create */}
        <TabsContent value="user-create" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>POST /api/radius/auth/user-create</CardTitle>
              <CardDescription>Create a new user or update existing user</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="create-clerk-id">Clerk User ID *</Label>
                  <Input
                    id="create-clerk-id"
                    placeholder="user_abc123"
                    value={createClerkId}
                    onChange={(e) => setCreateClerkId(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="create-email">Email *</Label>
                  <Input
                    id="create-email"
                    placeholder="user@refugehouse.org"
                    value={createEmail}
                    onChange={(e) => setCreateEmail(e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="create-first-name">First Name</Label>
                  <Input
                    id="create-first-name"
                    placeholder="John"
                    value={createFirstName}
                    onChange={(e) => setCreateFirstName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="create-last-name">Last Name</Label>
                  <Input
                    id="create-last-name"
                    placeholder="Doe"
                    value={createLastName}
                    onChange={(e) => setCreateLastName(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-microservice">Microservice Code</Label>
                <Input
                  id="create-microservice"
                  placeholder="home-visits"
                  value={createMicroservice}
                  onChange={(e) => setCreateMicroservice(e.target.value)}
                />
              </div>
              <Button
                onClick={() =>
                  testEndpoint(
                    "auth/user-create",
                    "POST",
                    undefined,
                    {
                      clerkUserId: createClerkId,
                      email: createEmail,
                      firstName: createFirstName,
                      lastName: createLastName,
                      microserviceCode: createMicroservice,
                    }
                  )
                }
                disabled={loading || !createClerkId || !createEmail}
              >
                {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                Test User Create
              </Button>
              {results["auth/user-create"] && (
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge variant={results["auth/user-create"].status === 200 ? "default" : "destructive"}>
                      {results["auth/user-create"].status === 200 ? (
                        <CheckCircle className="h-3 w-3 mr-1" />
                      ) : (
                        <XCircle className="h-3 w-3 mr-1" />
                      )}
                      Status: {results["auth/user-create"].status || "Error"}
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(JSON.stringify(results["auth/user-create"].response, null, 2))}
                    >
                      <Copy className="h-3 w-3 mr-1" />
                      Copy
                    </Button>
                  </div>
                  <Textarea
                    readOnly
                    value={JSON.stringify(results["auth/user-create"].response || results["auth/user-create"].error, null, 2)}
                    className="font-mono text-xs min-h-[200px]"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Permissions */}
        <TabsContent value="permissions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>GET /api/radius/permissions</CardTitle>
              <CardDescription>Get user permissions and roles for a microservice</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="perm-user-id">User ID *</Label>
                <Input
                  id="perm-user-id"
                  placeholder="user-guid-from-database"
                  value={permUserId}
                  onChange={(e) => setPermUserId(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Get this from the user-lookup response (user.id field)
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="perm-microservice">Microservice Code</Label>
                <Input
                  id="perm-microservice"
                  placeholder="home-visits"
                  value={permMicroservice}
                  onChange={(e) => setPermMicroservice(e.target.value)}
                />
              </div>
              <Button
                onClick={() =>
                  testEndpoint("permissions", "GET", {
                    userId: permUserId,
                    microserviceCode: permMicroservice,
                  })
                }
                disabled={loading || !permUserId}
              >
                {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                Test Permissions
              </Button>
              {results["permissions"] && (
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge variant={results["permissions"].status === 200 ? "default" : "destructive"}>
                      {results["permissions"].status === 200 ? (
                        <CheckCircle className="h-3 w-3 mr-1" />
                      ) : (
                        <XCircle className="h-3 w-3 mr-1" />
                      )}
                      Status: {results["permissions"].status || "Error"}
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(JSON.stringify(results["permissions"].response, null, 2))}
                    >
                      <Copy className="h-3 w-3 mr-1" />
                      Copy
                    </Button>
                  </div>
                  <Textarea
                    readOnly
                    value={JSON.stringify(results["permissions"].response || results["permissions"].error, null, 2)}
                    className="font-mono text-xs min-h-[200px]"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Navigation */}
        <TabsContent value="navigation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>GET /api/radius/navigation</CardTitle>
              <CardDescription>Get navigation items filtered by user permissions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nav-user-id">User ID</Label>
                <Input
                  id="nav-user-id"
                  placeholder="user-guid-from-database"
                  value={navUserId}
                  onChange={(e) => setNavUserId(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Optional - if provided, permissions will be fetched from database
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="nav-microservice">Microservice Code</Label>
                <Input
                  id="nav-microservice"
                  placeholder="home-visits"
                  value={navMicroservice}
                  onChange={(e) => setNavMicroservice(e.target.value)}
                />
              </div>
              <Button
                onClick={() =>
                  testEndpoint("navigation", "GET", {
                    userId: navUserId,
                    microserviceCode: navMicroservice,
                  })
                }
                disabled={loading}
              >
                {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                Test Navigation
              </Button>
              {results["navigation"] && (
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge variant={results["navigation"].status === 200 ? "default" : "destructive"}>
                      {results["navigation"].status === 200 ? (
                        <CheckCircle className="h-3 w-3 mr-1" />
                      ) : (
                        <XCircle className="h-3 w-3 mr-1" />
                      )}
                      Status: {results["navigation"].status || "Error"}
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(JSON.stringify(results["navigation"].response, null, 2))}
                    >
                      <Copy className="h-3 w-3 mr-1" />
                      Copy
                    </Button>
                  </div>
                  <Textarea
                    readOnly
                    value={JSON.stringify(results["navigation"].response || results["navigation"].error, null, 2)}
                    className="font-mono text-xs min-h-[200px]"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

