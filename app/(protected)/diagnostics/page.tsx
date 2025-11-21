"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@refugehouse/shared-core/components/ui/card"
import { Button } from "@refugehouse/shared-core/components/ui/button"
import { Badge } from "@refugehouse/shared-core/components/ui/badge"
import { RefreshCw, Database, Key, Globe, Server, Eye, EyeOff } from "lucide-react"

interface DiagnosticsData {
  timestamp: string
  deployment?: {
    environment: string
    microserviceCode: string
    vercelEnv?: string
    branch?: string
    url?: string
  }
  database: {
    status: string
    message: string
    data?: any[]
    passwordSource?: string
    passwordError?: string
  }
  environment: {
    azureKeyVault: {
      configured: boolean
      keyVaultName: string
      keyVaultUrl: string
      tenantId: string
      clientId: string
      secretName: string
    }
    database: {
      server: string
      database: string
      user: string
      port: number
      encryption: string
      trustServerCertificate: string
      connectTimeout: string
      requestTimeout: string
    }
  }
  environmentVariables?: Record<string, string | undefined>
  system: {
    nodeVersion: string
    platform: string
    environment: string
  }
  components: {
    databaseConnection: {
      status: string
      message: string
      details?: any
    }
    azureKeyVault: {
      status: string
      message: string
    }
    serverEnvironment: {
      status: string
      message: string
    }
  }
}

/**
 * PROTOCOL: Does NOT use Clerk hooks after authentication.
 * Gets Clerk ID from session API, then uses headers for API calls.
 */
export default function DiagnosticsPage() {
  const [data, setData] = useState<DiagnosticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showSensitive, setShowSensitive] = useState(false)
  const [sessionUser, setSessionUser] = useState<{ id: string; email: string; name: string } | null>(null)
  const [loadingSession, setLoadingSession] = useState(true)

  // Get Clerk ID from session (NO Clerk hooks)
  useEffect(() => {
    const fetchSessionUser = async () => {
      // Check sessionStorage first
      const storedUser = sessionStorage.getItem("session_user")
      if (storedUser) {
        try {
          const parsed = JSON.parse(storedUser)
          if (parsed.clerkUserId) {
            setSessionUser({
              id: parsed.clerkUserId,
              email: parsed.email || "",
              name: parsed.name || "",
            })
            setLoadingSession(false)
            return
          }
        } catch (e) {
          // Invalid stored data, fetch fresh
        }
      }

      // Fetch from API (uses Clerk server-side ONCE)
      try {
        const response = await fetch("/api/auth/get-session-user", {
          method: "GET",
          credentials: "include",
        })

        if (response.ok) {
          const data = await response.json()
          if (data.success && data.clerkUserId) {
            const user = {
              id: data.clerkUserId,
              email: data.email || "",
              name: data.name || "",
            }
            setSessionUser(user)
            // Store in sessionStorage
            sessionStorage.setItem("session_user", JSON.stringify({
              clerkUserId: data.clerkUserId,
              email: data.email,
              name: data.name,
            }))
          } else {
            console.error("❌ [Diagnostics] Session API returned invalid data:", data)
            setError("Failed to authenticate. Please refresh the page.")
          }
        } else {
          const errorData = await response.json().catch(() => ({}))
          console.error("❌ [Diagnostics] Session API error:", response.status, errorData)
          setError(errorData.details || errorData.message || `Authentication failed (${response.status})`)
        }
      } catch (error) {
        console.error("❌ [Diagnostics] Error fetching session user:", error)
        setError(error instanceof Error ? error.message : "Failed to authenticate. Please refresh the page.")
      } finally {
        setLoadingSession(false)
      }
    }

    fetchSessionUser()
  }, [])

  const fetchDiagnostics = async () => {
    if (!sessionUser) {
      setError("Please sign in to access diagnostics")
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const headers: HeadersInit = {
        "x-user-email": sessionUser.email,
        "x-user-clerk-id": sessionUser.id,
        "x-user-name": sessionUser.name,
      }

      const response = await fetch("/api/diagnostics", { 
        headers,
        credentials: 'include',
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()
      setData(result)
    } catch (err) {
      console.error("Error fetching diagnostics:", err)
      setError(err instanceof Error ? err.message : "Failed to fetch diagnostics")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!loadingSession && sessionUser) {
    fetchDiagnostics()
    } else if (!loadingSession && !sessionUser) {
      setError("Please sign in to access diagnostics")
      setLoading(false)
    }
  }, [loadingSession, sessionUser])

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "connected":
      case "healthy":
      case "active":
        return "bg-green-100 text-green-800"
      case "disconnected":
      case "error":
        return "bg-red-100 text-red-800"
      case "warning":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const maskSensitiveData = (value: string, show: boolean) => {
    if (show || !value || value === "Not configured") return value
    return value.replace(/./g, "•")
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-red-600">
              <p className="font-semibold">Error loading diagnostics</p>
              <p className="text-sm mt-2">{error}</p>
              <Button onClick={fetchDiagnostics} className="mt-4">
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">System Diagnostics</h1>
          <p className="text-muted-foreground">Real-time system health and configuration details</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setShowSensitive(!showSensitive)} size="sm">
            {showSensitive ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
            {showSensitive ? "Hide Details" : "Show Details"}
          </Button>
          <Button onClick={fetchDiagnostics} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Database Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              <div>
                <div
                  className={`text-lg font-semibold ${data.database.status === "connected" ? "text-green-600" : "text-red-600"}`}
                >
                  {data.database.status === "connected" ? "Connected" : "Disconnected"}
                </div>
                <div className="text-sm text-muted-foreground">
                  {data.database.status === "connected" ? "Azure SQL Database" : "RadiusBifrost"}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">System Health</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Server className="h-5 w-5" />
              <div>
                <div
                  className={`text-lg font-semibold ${data.database.status === "connected" ? "text-green-600" : "text-red-600"}`}
                >
                  {data.database.status === "connected" ? "Healthy" : "Degraded"}
                </div>
                <div className="text-sm text-muted-foreground">All systems operational</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Last Check</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5" />
              <div>
                <div className="text-lg font-semibold">{new Date(data.timestamp).toLocaleTimeString()}</div>
                <div className="text-sm text-muted-foreground">Real-time monitoring</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Database Connection Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Database Connection Configuration
            <Button variant="ghost" size="sm" onClick={() => setShowSensitive(!showSensitive)}>
              {showSensitive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </CardTitle>
          <p className="text-sm text-muted-foreground">Current database connection parameters being used</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Server</label>
                <div className="text-sm">{data.environment.database.server}</div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Database</label>
                <div className="text-sm">{data.environment.database.database}</div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">User</label>
                <div className="text-sm">{data.environment.database.user}</div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Encryption</label>
                <div className="text-sm">{data.environment.database.encryption}</div>
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Port</label>
                <div className="text-sm">{data.environment.database.port}</div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Trust Server Certificate</label>
                <div className="text-sm">{data.environment.database.trustServerCertificate}</div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Connect Timeout</label>
                <div className="text-sm">{data.environment.database.connectTimeout}</div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Request Timeout</label>
                <div className="text-sm">{data.environment.database.requestTimeout}</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Azure Key Vault Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Azure Key Vault Configuration</CardTitle>
          <p className="text-sm text-muted-foreground">Key Vault settings and authentication details</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Key Vault Name</label>
                <div className="text-sm">{data.environment.azureKeyVault.keyVaultName}</div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Key Vault URL</label>
                <div className="text-sm">{data.environment.azureKeyVault.keyVaultUrl}</div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Secret Name</label>
                <div className="text-sm">{data.environment.azureKeyVault.secretName}</div>
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Tenant ID</label>
                <div className="text-sm">
                  {maskSensitiveData(data.environment.azureKeyVault.tenantId, showSensitive)}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Client ID</label>
                <div className="text-sm">
                  {maskSensitiveData(data.environment.azureKeyVault.clientId, showSensitive)}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Status</label>
                <div className="flex items-center gap-2">
                  <Badge className={getStatusColor(data.components.azureKeyVault.status)}>
                    {data.environment.azureKeyVault.configured ? "✓ Configured" : "⚠ Not Configured"}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Deployment Information */}
      {data.deployment && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Deployment Information
            </CardTitle>
            <p className="text-sm text-muted-foreground">Current deployment environment and configuration</p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Deployment Environment</label>
                  <div className="text-sm font-semibold">{data.deployment.environment}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Microservice Code</label>
                  <div className="text-sm">{data.deployment.microserviceCode}</div>
                </div>
                {data.deployment.branch && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Git Branch</label>
                    <div className="text-sm">{data.deployment.branch}</div>
                  </div>
                )}
              </div>
              <div className="space-y-3">
                {data.deployment.vercelEnv && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Vercel Environment</label>
                    <div className="text-sm">{data.deployment.vercelEnv}</div>
                  </div>
                )}
                {data.deployment.url && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Deployment URL</label>
                    <div className="text-sm break-all">{data.deployment.url}</div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Environment Variables */}
      {data.environmentVariables && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <Server className="h-5 w-5" />
              Environment Variables
              <Button variant="ghost" size="sm" onClick={() => setShowSensitive(!showSensitive)}>
                {showSensitive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </CardTitle>
            <p className="text-sm text-muted-foreground">System environment variables (sensitive values masked)</p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(data.environmentVariables)
                .filter(([_, value]) => value !== undefined)
                .map(([key, value]) => (
                  <div key={key} className="flex flex-col">
                    <label className="text-xs font-medium text-muted-foreground mb-1">{key}</label>
                    <div className="text-sm font-mono break-all">
                      {showSensitive ? value : (value && value.length > 0 ? maskSensitiveData(String(value), false) : "Not set")}
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* System Components */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            System Components
            <Button variant="outline" size="sm" onClick={fetchDiagnostics}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Run Tests
            </Button>
          </CardTitle>
          <p className="text-sm text-muted-foreground">Real-time status of all system components</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(data.components).map(([key, component]) => (
              <div key={key} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  {key === "databaseConnection" && <Database className="h-5 w-5 text-muted-foreground" />}
                  {key === "azureKeyVault" && <Key className="h-5 w-5 text-muted-foreground" />}
                  {key === "serverEnvironment" && <Server className="h-5 w-5 text-muted-foreground" />}
                  <div>
                    <div className="font-medium">
                      {key === "databaseConnection" && "Database Connection"}
                      {key === "azureKeyVault" && "Azure Key Vault"}
                      {key === "serverEnvironment" && "Server Environment"}
                    </div>
                    <div className="text-sm text-muted-foreground">{component.message}</div>
                  </div>
                </div>
                <Badge className={getStatusColor(component.status)}>
                  {component.status === "healthy" && "Healthy"}
                  {component.status === "error" && "Error"}
                  {component.status === "warning" && "Warning"}
                  {component.status === "active" && "Active"}
                  {component.status === "connected" && "Connected"}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Connection Details */}
      {data.database.data && showSensitive && (
        <Card>
          <CardHeader>
            <CardTitle>Live Connection Details</CardTitle>
            <p className="text-sm text-muted-foreground">Real-time connection information from database</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.database.data.map((row: any, index: number) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-4 p-3 bg-gray-50 rounded">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Login Name</label>
                    <div className="text-sm">{row.login_name}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Database</label>
                    <div className="text-sm">{row.db_name}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Client IP</label>
                    <div className="text-sm">{row.client_ip}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
