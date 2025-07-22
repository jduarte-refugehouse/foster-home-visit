"use client"

import { useState, useEffect } from "react"
import { useUser } from "@clerk/nextjs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ArrowLeft,
  Settings,
  Database,
  Shield,
  Globe,
  Lock,
} from "lucide-react"
import Link from "next/link"
import { Navigation } from "@/components/navigation"

interface DiagnosticData {
  timestamp: string
  overall: {
    status: string
    message: string
  }
  proxy: {
    enabled: boolean
    url: string
    masked: string
    clientIp: string
  }
  database: {
    connected: boolean
    error: string
    clientIp: string
  }
  keyVault: {
    configured: boolean
    passwordSource: string
    error: string
    config: {
      tenantId: string
      clientId: string
      clientSecret: string
      keyVaultName: string
    }
  }
}

export default function DiagnosticsPage() {
  const { isSignedIn, isLoaded } = useUser()
  const [data, setData] = useState<DiagnosticData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const runDiagnostics = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch("/api/diagnostics")
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const result = await response.json()
      setData(result)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isSignedIn) {
      runDiagnostics()
    }
  }, [isSignedIn])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case "error":
        return <XCircle className="h-5 w-5 text-red-600" />
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />
      default:
        return <AlertTriangle className="h-5 w-5 text-gray-400" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "success":
        return <Badge className="bg-green-100 text-green-800 border-green-200">Success</Badge>
      case "error":
        return <Badge className="bg-red-100 text-red-800 border-red-200">Failed</Badge>
      case "warning":
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Warning</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!isSignedIn) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
          <Card className="w-full max-w-md">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Lock className="h-12 w-12 text-gray-400 mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Authentication Required</h2>
              <p className="text-gray-600 text-center mb-6">You need to be signed in to access the diagnostics page.</p>
              <Link href="/">
                <Button>Go to Home</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="p-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
                <ArrowLeft className="h-4 w-4" />
                Back to Home
              </Link>
              <div className="flex items-center gap-2">
                <Settings className="h-6 w-6 text-blue-600" />
                <h1 className="text-3xl font-bold text-gray-900">Connection Diagnostics</h1>
              </div>
            </div>
            <Button onClick={runDiagnostics} disabled={loading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Run Diagnostics
            </Button>
          </div>

          <p className="text-gray-600 mb-8">Testing the database connection via the Fixie SOCKS proxy.</p>

          {loading && (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <div className="text-center">
                  <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
                  <p className="text-gray-600">Running diagnostics...</p>
                </div>
              </CardContent>
            </Card>
          )}

          {error && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="py-6">
                <div className="flex items-center gap-2 text-red-800">
                  <XCircle className="h-5 w-5" />
                  <span className="font-medium">Diagnostic Error: {error}</span>
                </div>
              </CardContent>
            </Card>
          )}

          {data && (
            <div className="space-y-6">
              {/* Overall Status */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(data.overall.status)}
                    <CardTitle className="text-xl">Overall Status</CardTitle>
                  </div>
                  {getStatusBadge(data.overall.status)}
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-2">
                    Diagnostic completed at {new Date(data.timestamp).toLocaleString()}
                  </p>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="font-medium">Analysis: </span>
                      <span className="text-green-700">{data.overall.message}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Password Security Status */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-blue-600" />
                    <CardTitle className="text-xl">Password Security Status</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Password Source:</span>
                    <div className="flex items-center gap-2">
                      {data.keyVault.configured ? (
                        <>
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <Badge className="bg-blue-100 text-blue-800 border-blue-200">Azure Key Vault</Badge>
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="h-4 w-4 text-yellow-600" />
                          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Fallback</Badge>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <div>
                      {data.keyVault.configured ? (
                        <span className="text-green-700">
                          ✅ Excellent! Password is being securely retrieved from Azure Key Vault.
                        </span>
                      ) : (
                        <span className="text-yellow-700">
                          ⚠️ Using fallback password. Key Vault error: {data.keyVault.error}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium mb-2">Key Vault Configuration:</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex justify-between">
                        <span>Tenant ID:</span>
                        <span className="font-mono">{data.keyVault.config.tenantId}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Client ID:</span>
                        <span className="font-mono">{data.keyVault.config.clientId}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Client Secret:</span>
                        <span className="font-mono">{data.keyVault.config.clientSecret}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Key Vault Name:</span>
                        <span className="font-mono">{data.keyVault.config.keyVaultName}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Proxy Configuration */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div className="flex items-center gap-2">
                    <Globe className="h-5 w-5 text-purple-600" />
                    <CardTitle className="text-xl">Proxy Configuration</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Using Proxy:</span>
                    <Badge variant={data.proxy.enabled ? "default" : "outline"}>
                      {data.proxy.enabled ? "Yes" : "No"}
                    </Badge>
                  </div>
                  {data.proxy.enabled && (
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Fixie URL (Masked):</span>
                      <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">{data.proxy.masked}</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Database Connection Details */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div className="flex items-center gap-2">
                    <Database className="h-5 w-5 text-green-600" />
                    <CardTitle className="text-xl">Database Connection Details</CardTitle>
                  </div>
                  <Badge
                    className={
                      data.database.connected
                        ? "bg-green-100 text-green-800 border-green-200"
                        : "bg-red-100 text-red-800 border-red-200"
                    }
                  >
                    {data.database.connected ? "Connected" : "Failed"}
                  </Badge>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-2">
                    {data.database.connected ? (
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                    )}
                    <div>
                      {data.database.connected ? (
                        <span className="text-green-700">Database connection successful.</span>
                      ) : (
                        <span className="text-red-700">Database connection failed: {data.database.error}</span>
                      )}
                    </div>
                  </div>

                  {data.database.connected && data.database.clientIp && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-medium mb-2">Client IP Address Seen by SQL Server:</h4>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-lg bg-white px-3 py-2 rounded border">
                          {data.database.clientIp}
                        </span>
                        {data.proxy.enabled && data.database.clientIp.startsWith("3.") && (
                          <Badge className="bg-green-100 text-green-800 border-green-200">✓ Matches Fixie IP</Badge>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
