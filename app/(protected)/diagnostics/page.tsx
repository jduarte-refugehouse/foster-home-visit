"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { RefreshCw, CheckCircle, XCircle, AlertTriangle, Eye, EyeOff } from "lucide-react"

interface DiagnosticsData {
  timestamp: string
  database: {
    status: string
    config: {
      server: string
      port: number
      database: string
      user: string
      encryption: string
      trustServerCertificate: string
      connectTimeout: string
      requestTimeout: string
    }
    test: {
      success: boolean
      message: string
      data?: any[]
      passwordSource?: string
      passwordError?: string
    }
  }
  environment: {
    azureKeyVault: {
      configured: boolean
      keyVaultName: string
      tenantId: string
      clientId: string
    }
    proxy: {
      configured: boolean
      host: string
    }
    server: {
      environment: string
      platform: string
      nodeVersion: string
    }
  }
  systemHealth: {
    overall: string
    components: {
      [key: string]: {
        status: string
        message: string
      }
    }
  }
}

export default function DiagnosticsPage() {
  const [data, setData] = useState<DiagnosticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showSensitive, setShowSensitive] = useState(false)

  const fetchDiagnostics = async () => {
    try {
      setLoading(true)
      setError(null)
      console.log("🔍 Running diagnostics...")

      const response = await fetch("/api/diagnostics")
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()
      console.log("✅ Diagnostics completed:", result)
      setData(result)
    } catch (err) {
      console.error("❌ Error running diagnostics:", err)
      setError(err instanceof Error ? err.message : "Failed to run diagnostics")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDiagnostics()
  }, [])

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "healthy":
      case "connected":
      case "active":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "error":
      case "disconnected":
        return <XCircle className="h-4 w-4 text-red-600" />
      case "warning":
      case "degraded":
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-400" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "healthy":
      case "connected":
        return "text-green-600"
      case "error":
      case "disconnected":
        return "text-red-600"
      case "warning":
      case "degraded":
        return "text-yellow-600"
      default:
        return "text-gray-600"
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">System Diagnostics</h1>
          <p className="text-muted-foreground">Running system health checks...</p>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center h-32">
              <RefreshCw className="h-8 w-8 animate-spin" />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">System Diagnostics</h1>
          <p className="text-muted-foreground">Real-time system health and configuration details</p>
        </div>
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-800">Diagnostics Failed</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-700 mb-4">{error}</p>
            <Button onClick={fetchDiagnostics} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">System Diagnostics</h1>
          <p className="text-muted-foreground">Real-time system health and configuration details</p>
        </div>
        <Button onClick={fetchDiagnostics} variant="outline" disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* System Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Database Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              {getStatusIcon(data.database.status)}
              <span className={`font-semibold capitalize ${getStatusColor(data.database.status)}`}>
                {data.database.status}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">{data.database.config.database}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">System Health</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              {getStatusIcon(data.systemHealth.overall)}
              <span className={`font-semibold capitalize ${getStatusColor(data.systemHealth.overall)}`}>
                {data.systemHealth.overall}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">All systems operational</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Last Check</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-semibold">{new Date(data.timestamp).toLocaleTimeString()}</div>
            <p className="text-xs text-muted-foreground mt-1">Real-time monitoring</p>
          </CardContent>
        </Card>
      </div>

      {/* Database Configuration */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Database Connection Configuration</CardTitle>
              <CardDescription>Current database connection parameters being used</CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSensitive(!showSensitive)}
              className="flex items-center gap-2"
            >
              {showSensitive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              {showSensitive ? "Hide Details" : "Show Details"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-sm font-medium text-muted-foreground">Server</div>
              <div className="font-mono text-sm">{data.database.config.server}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">Port</div>
              <div className="font-mono text-sm">{data.database.config.port}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">Database</div>
              <div className="font-mono text-sm">{data.database.config.database}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">User</div>
              <div className="font-mono text-sm">{data.database.config.user}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">Encryption</div>
              <div className="font-mono text-sm">{data.database.config.encryption}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">Trust Server Certificate</div>
              <div className="font-mono text-sm">{data.database.config.trustServerCertificate}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">Connect Timeout</div>
              <div className="font-mono text-sm">{data.database.config.connectTimeout}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">Request Timeout</div>
              <div className="font-mono text-sm">{data.database.config.requestTimeout}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Azure Key Vault Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Azure Key Vault Configuration</CardTitle>
          <CardDescription>Key Vault settings and authentication details</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-sm font-medium text-muted-foreground">Key Vault Name</div>
              <div className="font-mono text-sm">{data.environment.azureKeyVault.keyVaultName}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">Key Vault URL</div>
              <div className="font-mono text-sm">
                https://{data.environment.azureKeyVault.keyVaultName}.vault.azure.net/
              </div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">Secret Name</div>
              <div className="font-mono text-sm">database-password</div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">Tenant ID</div>
              <div className="font-mono text-sm">
                {showSensitive ? data.environment.azureKeyVault.tenantId : "••••••••"}
              </div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">Client ID</div>
              <div className="font-mono text-sm">
                {showSensitive ? data.environment.azureKeyVault.clientId : "••••••••"}
              </div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">Status</div>
              <div className="flex items-center gap-2">
                {getStatusIcon(data.environment.azureKeyVault.configured ? "healthy" : "error")}
                <span className="text-sm">
                  {data.environment.azureKeyVault.configured ? "Configured" : "Not Configured"}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Proxy Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Proxy Configuration</CardTitle>
          <CardDescription>SOCKS proxy settings for database connection</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm font-medium text-muted-foreground">Fixie SOCKS Host</div>
              <div className="font-mono text-sm">{showSensitive ? data.environment.proxy.host : "••••••••"}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">Status</div>
              <div className="flex items-center gap-2">
                {getStatusIcon(data.environment.proxy.configured ? "healthy" : "warning")}
                <span className="text-sm">{data.environment.proxy.configured ? "Configured" : "Not Configured"}</span>
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
              <RefreshCw className="w-4 h-4 mr-2" />
              Run Tests
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(data.systemHealth.components).map(([key, component]) => (
              <div key={key} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(component.status)}
                  <div>
                    <div className="font-medium capitalize">
                      {key.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase())}
                    </div>
                    <div className="text-sm text-muted-foreground">{component.message}</div>
                  </div>
                </div>
                <Badge
                  variant={
                    component.status === "healthy"
                      ? "default"
                      : component.status === "error"
                        ? "destructive"
                        : "secondary"
                  }
                  className="capitalize"
                >
                  {component.status}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
