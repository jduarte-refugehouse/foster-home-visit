"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { RefreshCw, Database, Server, AlertCircle, CheckCircle, XCircle } from "lucide-react"

interface DiagnosticsData {
  timestamp: string
  database: {
    connected: boolean
    connectionDetails: {
      user: string
      database: string
      server: string
      port: number
      encrypt: boolean
      trustServerCertificate: boolean
      connectTimeout: number
      requestTimeout: number
    }
    details?: {
      login_name: string
      database_name: string
      sql_version: string
      server_time: string
    }
    error?: string
  }
  keyVault: {
    configured: boolean
    keyVaultName?: string
    keyVaultUrl?: string
    secretName: string
    tenantId?: string
    clientId?: string
    error?: string
  }
  proxy: {
    configured: boolean
    fixieHost?: string
    error?: string
  }
  environment: {
    nodeEnv: string
    hasKeyVault: boolean
    hasFixieProxy: boolean
    userAgent: string
  }
  server: {
    platform: string
    nodeVersion: string
  }
}

export default function DiagnosticsPage() {
  const [diagnostics, setDiagnostics] = useState<DiagnosticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showDetails, setShowDetails] = useState(false)

  const fetchDiagnostics = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch("/api/diagnostics", {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache",
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      setDiagnostics(data)
    } catch (err) {
      console.error("Failed to fetch diagnostics:", err)
      setError(err instanceof Error ? err.message : "Failed to fetch diagnostics")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDiagnostics()
  }, [])

  const getStatusBadge = (connected: boolean, error?: string) => {
    if (error) {
      return <Badge variant="destructive">Error</Badge>
    }
    return connected ? (
      <Badge variant="default" className="bg-green-500">
        Healthy
      </Badge>
    ) : (
      <Badge variant="destructive">Disconnected</Badge>
    )
  }

  const getStatusIcon = (connected: boolean, error?: string) => {
    if (error) {
      return <XCircle className="h-5 w-5 text-red-500" />
    }
    return connected ? <CheckCircle className="h-5 w-5 text-green-500" /> : <XCircle className="h-5 w-5 text-red-500" />
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">System Diagnostics</h1>
            <p className="text-muted-foreground">Real-time system health and configuration details</p>
          </div>
        </div>
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">System Diagnostics</h1>
            <p className="text-muted-foreground">Real-time system health and configuration details</p>
          </div>
          <Button onClick={fetchDiagnostics} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              <span>Error: {error}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!diagnostics) {
    return null
  }

  const dbConnected = diagnostics.database.connected
  const systemHealthy = dbConnected && diagnostics.keyVault.configured && diagnostics.proxy.configured

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">System Diagnostics</h1>
          <p className="text-muted-foreground">Real-time system health and configuration details</p>
        </div>
        <Button onClick={fetchDiagnostics} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Database Status</p>
                <p className={`text-2xl font-bold ${dbConnected ? "text-green-600" : "text-red-600"}`}>
                  {dbConnected ? "Connected" : "Disconnected"}
                </p>
                <p className="text-xs text-muted-foreground">{diagnostics.database.connectionDetails.database}</p>
              </div>
              <Database className={`h-8 w-8 ${dbConnected ? "text-green-500" : "text-red-500"}`} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">System Health</p>
                <p className={`text-2xl font-bold ${systemHealthy ? "text-green-600" : "text-red-600"}`}>
                  {systemHealthy ? "Healthy" : "Degraded"}
                </p>
                <p className="text-xs text-muted-foreground">All systems operational</p>
              </div>
              <Server className={`h-8 w-8 ${systemHealthy ? "text-green-500" : "text-red-500"}`} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Last Check</p>
                <p className="text-2xl font-bold">{new Date(diagnostics.timestamp).toLocaleTimeString()}</p>
                <p className="text-xs text-muted-foreground">Real-time monitoring</p>
              </div>
              <RefreshCw className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Database Connection Configuration */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Database Connection Configuration</CardTitle>
              <CardDescription>Current database connection parameters being used</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setShowDetails(!showDetails)}>
              {showDetails ? "Hide Details" : "Show Details"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Server</p>
              <p className="font-mono text-sm">{diagnostics.database.connectionDetails.server}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Port</p>
              <p className="font-mono text-sm">{diagnostics.database.connectionDetails.port}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Database</p>
              <p className="font-mono text-sm">{diagnostics.database.connectionDetails.database}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">User</p>
              <p className="font-mono text-sm">{diagnostics.database.connectionDetails.user}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Encryption</p>
              <p className="font-mono text-sm">
                {diagnostics.database.connectionDetails.encrypt ? "Enabled" : "Disabled"}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Trust Server Certificate</p>
              <p className="font-mono text-sm">
                {diagnostics.database.connectionDetails.trustServerCertificate ? "Yes" : "No"}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Connect Timeout</p>
              <p className="font-mono text-sm">{diagnostics.database.connectionDetails.connectTimeout}ms</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Request Timeout</p>
              <p className="font-mono text-sm">{diagnostics.database.connectionDetails.requestTimeout}ms</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Azure Key Vault Configuration */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Azure Key Vault Configuration</CardTitle>
          <CardDescription>Key Vault settings and authentication details</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Key Vault Name</p>
              <p className="font-mono text-sm">{diagnostics.keyVault.keyVaultName || "Not configured"}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Key Vault URL</p>
              <p className="font-mono text-sm break-all">{diagnostics.keyVault.keyVaultUrl || "Not configured"}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Secret Name</p>
              <p className="font-mono text-sm">{diagnostics.keyVault.secretName}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Tenant ID</p>
              <p className="font-mono text-sm">{diagnostics.keyVault.tenantId || "Not configured"}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Client ID</p>
              <p className="font-mono text-sm">{diagnostics.keyVault.clientId || "Not configured"}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Status</p>
              <div className="flex items-center space-x-2">
                {diagnostics.keyVault.configured ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-500" />
                )}
                <span className="text-sm">{diagnostics.keyVault.configured ? "Configured" : "Not configured"}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Proxy Configuration */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Proxy Configuration</CardTitle>
          <CardDescription>SOCKS proxy settings for database connection</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Fixie SOCKS Host</p>
              <p className="font-mono text-sm break-all">{diagnostics.proxy.fixieHost || "Not configured"}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Status</p>
              <div className="flex items-center space-x-2">
                {diagnostics.proxy.configured ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-500" />
                )}
                <span className="text-sm">{diagnostics.proxy.configured ? "Configured" : "Not configured"}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Components */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>System Components</CardTitle>
              <CardDescription>Real-time status of all system components</CardDescription>
            </div>
            <Button onClick={fetchDiagnostics} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Run Tests
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center space-x-3">
                {getStatusIcon(diagnostics.database.connected, diagnostics.database.error)}
                <div>
                  <p className="font-medium">Database Connection</p>
                  <p className="text-sm text-muted-foreground">
                    {diagnostics.database.error ||
                      (diagnostics.database.connected ? "Database connection active" : "Database connection failed")}
                  </p>
                </div>
              </div>
              {getStatusBadge(diagnostics.database.connected, diagnostics.database.error)}
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center space-x-3">
                {getStatusIcon(diagnostics.keyVault.configured)}
                <div>
                  <p className="font-medium">Azure Key Vault</p>
                  <p className="text-sm text-muted-foreground">
                    {diagnostics.keyVault.configured
                      ? "Key Vault configured and accessible"
                      : "Key Vault not configured"}
                  </p>
                </div>
              </div>
              {getStatusBadge(diagnostics.keyVault.configured)}
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center space-x-3">
                {getStatusIcon(diagnostics.proxy.configured)}
                <div>
                  <p className="font-medium">Proxy Connection</p>
                  <p className="text-sm text-muted-foreground">
                    {diagnostics.proxy.configured ? "Fixie SOCKS proxy configured" : "No proxy configured"}
                  </p>
                </div>
              </div>
              {getStatusBadge(diagnostics.proxy.configured)}
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <div>
                  <p className="font-medium">Server Environment</p>
                  <p className="text-sm text-muted-foreground">
                    {diagnostics.environment.nodeEnv} environment on {diagnostics.server.platform}
                  </p>
                </div>
              </div>
              <Badge variant="secondary">Active</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
