"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { RefreshCw, Database, Server, Shield, AlertCircle, CheckCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface DiagnosticResult {
  name: string
  status: "success" | "warning" | "error"
  message: string
  details?: string
  timestamp: string
}

interface SystemStatus {
  database: DiagnosticResult
  authentication: DiagnosticResult
  permissions: DiagnosticResult
  microservices: DiagnosticResult
  overall: "healthy" | "warning" | "critical"
}

export default function DiagnosticsPage() {
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    runDiagnostics()
  }, [])

  const runDiagnostics = async () => {
    console.log("🔍 [Diagnostics Page] Starting diagnostics...")
    setRefreshing(true)

    try {
      const response = await fetch("/api/diagnostics")
      console.log("📡 [Diagnostics Page] API response status:", response.status)

      if (response.ok) {
        const data = await response.json()
        console.log("📊 [Diagnostics Page] Received data:", data)
        setSystemStatus(data)

        toast({
          title: "Diagnostics Complete",
          description: `System status: ${data.overall}`,
          variant: data.overall === "healthy" ? "default" : "destructive",
        })
      } else {
        const errorText = await response.text()
        console.error("❌ [Diagnostics Page] API error:", response.status, errorText)

        toast({
          title: "Error",
          description: "Failed to run diagnostics",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("❌ [Diagnostics Page] Network error:", error)
      toast({
        title: "Error",
        description: "Failed to run diagnostics",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "warning":
        return <AlertCircle className="h-5 w-5 text-yellow-500" />
      case "error":
        return <AlertCircle className="h-5 w-5 text-red-500" />
      default:
        return <AlertCircle className="h-5 w-5 text-gray-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "success":
        return <Badge className="bg-green-100 text-green-800">Healthy</Badge>
      case "warning":
        return <Badge className="bg-yellow-100 text-yellow-800">Warning</Badge>
      case "error":
        return <Badge className="bg-red-100 text-red-800">Error</Badge>
      default:
        return <Badge variant="secondary">Unknown</Badge>
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">System Diagnostics</h1>
          <p className="text-muted-foreground">Monitor system health and performance</p>
        </div>
        <Button onClick={runDiagnostics} disabled={refreshing}>
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
          {refreshing ? "Running..." : "Refresh"}
        </Button>
      </div>

      {systemStatus && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="h-5 w-5" />
                Overall System Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                {getStatusIcon(systemStatus.overall === "healthy" ? "success" : "error")}
                <span className="text-lg font-medium">
                  {systemStatus.overall === "healthy" ? "System Healthy" : "Issues Detected"}
                </span>
                {getStatusBadge(systemStatus.overall === "healthy" ? "success" : "error")}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Database Connection
                </CardTitle>
                <CardDescription>Database connectivity and performance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span>Status</span>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(systemStatus.database.status)}
                      {getStatusBadge(systemStatus.database.status)}
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">{systemStatus.database.message}</div>
                  {systemStatus.database.details && (
                    <div className="text-xs text-muted-foreground bg-gray-50 p-2 rounded">
                      {systemStatus.database.details}
                    </div>
                  )}
                  <div className="text-xs text-muted-foreground">
                    Last checked: {new Date(systemStatus.database.timestamp).toLocaleString()}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Authentication
                </CardTitle>
                <CardDescription>User authentication and authorization</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span>Status</span>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(systemStatus.authentication.status)}
                      {getStatusBadge(systemStatus.authentication.status)}
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">{systemStatus.authentication.message}</div>
                  {systemStatus.authentication.details && (
                    <div className="text-xs text-muted-foreground bg-gray-50 p-2 rounded">
                      {systemStatus.authentication.details}
                    </div>
                  )}
                  <div className="text-xs text-muted-foreground">
                    Last checked: {new Date(systemStatus.authentication.timestamp).toLocaleString()}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Permissions System
                </CardTitle>
                <CardDescription>Role and permission management</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span>Status</span>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(systemStatus.permissions.status)}
                      {getStatusBadge(systemStatus.permissions.status)}
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">{systemStatus.permissions.message}</div>
                  {systemStatus.permissions.details && (
                    <div className="text-xs text-muted-foreground bg-gray-50 p-2 rounded">
                      {systemStatus.permissions.details}
                    </div>
                  )}
                  <div className="text-xs text-muted-foreground">
                    Last checked: {new Date(systemStatus.permissions.timestamp).toLocaleString()}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Server className="h-5 w-5" />
                  Microservices
                </CardTitle>
                <CardDescription>Microservice configuration and connectivity</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span>Status</span>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(systemStatus.microservices.status)}
                      {getStatusBadge(systemStatus.microservices.status)}
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">{systemStatus.microservices.message}</div>
                  {systemStatus.microservices.details && (
                    <div className="text-xs text-muted-foreground bg-gray-50 p-2 rounded">
                      {systemStatus.microservices.details}
                    </div>
                  )}
                  <div className="text-xs text-muted-foreground">
                    Last checked: {new Date(systemStatus.microservices.timestamp).toLocaleString()}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {!systemStatus && !loading && (
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-muted-foreground">
              <p>No diagnostic data available. Click refresh to run diagnostics.</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
