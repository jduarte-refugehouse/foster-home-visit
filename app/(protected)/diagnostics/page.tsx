"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Database, Activity, AlertCircle, CheckCircle, RefreshCw, XCircle } from "lucide-react"

interface DiagnosticsData {
  timestamp: string
  database: {
    connected: boolean
    details?: {
      login_name: string
      database_name: string
      sql_version: string
      current_time: string
    }
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
  error?: string
}

export default function DiagnosticsPage() {
  const [diagnostics, setDiagnostics] = useState<DiagnosticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)

  const fetchDiagnostics = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/diagnostics", {
        method: "GET",
        cache: "no-store",
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      setDiagnostics(data)
      setLastRefresh(new Date())
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error"
      setError(errorMessage)
      console.error("Diagnostics fetch error:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDiagnostics()
  }, [])

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour12: true,
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
    })
  }

  const getStatusIcon = (isHealthy: boolean, isLoading = false) => {
    if (isLoading) return <RefreshCw className="h-4 w-4 text-muted-foreground animate-spin" />
    if (isHealthy) return <CheckCircle className="h-4 w-4 text-green-500" />
    return <XCircle className="h-4 w-4 text-red-500" />
  }

  const getStatusBadge = (isHealthy: boolean, isLoading = false) => {
    if (isLoading) return <Badge variant="secondary">Checking...</Badge>
    if (isHealthy)
      return (
        <Badge variant="default" className="bg-green-600">
          Healthy
        </Badge>
      )
    return <Badge variant="destructive">Error</Badge>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">System Diagnostics</h1>
        <p className="text-muted-foreground">Real-time system health and performance monitoring</p>
      </div>

      {/* System Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Database Status</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${
                loading ? "text-muted-foreground" : diagnostics?.database.connected ? "text-green-600" : "text-red-600"
              }`}
            >
              {loading ? "Checking..." : diagnostics?.database.connected ? "Connected" : "Disconnected"}
            </div>
            <p className="text-xs text-muted-foreground">
              {diagnostics?.database.details?.database_name || "Azure SQL Database"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Health</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${
                loading
                  ? "text-muted-foreground"
                  : error
                    ? "text-red-600"
                    : diagnostics?.database.connected
                      ? "text-green-600"
                      : "text-red-600"
              }`}
            >
              {loading ? "Checking..." : error ? "Error" : diagnostics?.database.connected ? "Healthy" : "Degraded"}
            </div>
            <p className="text-xs text-muted-foreground">
              {error ? "System experiencing issues" : "All systems operational"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Check</CardTitle>
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? "Checking..." : lastRefresh ? formatTime(lastRefresh) : "Never"}
            </div>
            <p className="text-xs text-muted-foreground">Real-time monitoring</p>
          </CardContent>
        </Card>
      </div>

      {/* Error Display */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-800 flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Diagnostics Error
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-700">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Detailed Diagnostics */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>System Components</CardTitle>
              <CardDescription>Real-time status of all system components</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={fetchDiagnostics} disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              {loading ? "Testing..." : "Run Tests"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Database Connection */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center space-x-3">
                {getStatusIcon(diagnostics?.database.connected || false, loading)}
                <div>
                  <h3 className="font-medium">Database Connection</h3>
                  <p className="text-sm text-muted-foreground">
                    {loading
                      ? "Testing connection..."
                      : diagnostics?.database.connected
                        ? `Connected to ${diagnostics.database.details?.database_name || "Azure SQL"}`
                        : "Database connection failed"}
                  </p>
                </div>
              </div>
              {getStatusBadge(diagnostics?.database.connected || false, loading)}
            </div>

            {/* Environment Info */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center space-x-3">
                {getStatusIcon(diagnostics?.environment.hasKeyVault || false, loading)}
                <div>
                  <h3 className="font-medium">Azure Key Vault</h3>
                  <p className="text-sm text-muted-foreground">
                    {loading
                      ? "Checking configuration..."
                      : diagnostics?.environment.hasKeyVault
                        ? "Key Vault configured and accessible"
                        : "Key Vault not configured"}
                  </p>
                </div>
              </div>
              {getStatusBadge(diagnostics?.environment.hasKeyVault || false, loading)}
            </div>

            {/* Proxy Connection */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center space-x-3">
                {getStatusIcon(diagnostics?.environment.hasFixieProxy || false, loading)}
                <div>
                  <h3 className="font-medium">Proxy Connection</h3>
                  <p className="text-sm text-muted-foreground">
                    {loading
                      ? "Checking proxy..."
                      : diagnostics?.environment.hasFixieProxy
                        ? "Fixie SOCKS proxy configured"
                        : "No proxy configured"}
                  </p>
                </div>
              </div>
              {getStatusBadge(diagnostics?.environment.hasFixieProxy || false, loading)}
            </div>

            {/* Server Info */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center space-x-3">
                {getStatusIcon(true, loading)}
                <div>
                  <h3 className="font-medium">Server Environment</h3>
                  <p className="text-sm text-muted-foreground">
                    {loading
                      ? "Gathering info..."
                      : `${diagnostics?.environment.nodeEnv || "unknown"} environment on ${diagnostics?.server.platform || "unknown"}`}
                  </p>
                </div>
              </div>
              <Badge variant="default">Active</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Database Details */}
      {diagnostics?.database.connected && diagnostics.database.details && (
        <Card>
          <CardHeader>
            <CardTitle>Database Connection Details</CardTitle>
            <CardDescription>Live connection information from the database</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-sm text-muted-foreground">Login Name</h4>
                <p className="font-mono text-sm">{diagnostics.database.details.login_name}</p>
              </div>
              <div>
                <h4 className="font-medium text-sm text-muted-foreground">Database</h4>
                <p className="font-mono text-sm">{diagnostics.database.details.database_name}</p>
              </div>
              <div>
                <h4 className="font-medium text-sm text-muted-foreground">Server Time</h4>
                <p className="font-mono text-sm">
                  {new Date(diagnostics.database.details.current_time).toLocaleString()}
                </p>
              </div>
              <div>
                <h4 className="font-medium text-sm text-muted-foreground">SQL Version</h4>
                <p className="font-mono text-sm text-xs">{diagnostics.database.details.sql_version.split("\n")[0]}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
