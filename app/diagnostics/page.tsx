"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, RefreshCw, CheckCircle, XCircle, Settings } from "lucide-react"
import Link from "next/link"

interface DiagnosticsData {
  timestamp: string
  proxy: {
    enabled: boolean
    url: string
  }
  database: {
    success: boolean
    message: string
    data?: any[]
  }
  environment: {
    nodeEnv: string
    vercelEnv: string
  }
}

export default function DiagnosticsPage() {
  const [diagnostics, setDiagnostics] = useState<DiagnosticsData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const runDiagnostics = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/diagnostics")
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      setDiagnostics(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error occurred")
    } finally {
      setLoading(false)
    }
  }

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString("en-US", {
      month: "numeric",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    })
  }

  const getOverallStatus = () => {
    if (!diagnostics) return null
    return diagnostics.database.success ? "success" : "failed"
  }

  const getClientIP = () => {
    if (!diagnostics?.database.data?.[0]) return null
    return diagnostics.database.data[0].client_ip
  }

  const isFixieIP = (ip: string) => {
    // Fixie IP ranges - you may need to adjust these based on your actual Fixie IPs
    const fixieRanges = ["3.223.", "54.", "52."]
    return fixieRanges.some((range) => ip.startsWith(range))
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Link>
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">Connection Diagnostics</h1>
            </div>
          </div>
          <Button onClick={runDiagnostics} disabled={loading} className="flex items-center gap-2">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Run Diagnostics
          </Button>
        </div>

        <p className="text-gray-600 mb-8">Testing the database connection via the Fixie SOCKS proxy.</p>

        {error && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-red-700">
                <XCircle className="h-5 w-5" />
                <span className="font-medium">Error: {error}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {diagnostics && (
          <>
            {/* Overall Status */}
            <Card className="mb-6">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getOverallStatus() === "success" ? (
                      <CheckCircle className="h-6 w-6 text-green-600" />
                    ) : (
                      <XCircle className="h-6 w-6 text-red-600" />
                    )}
                    <div>
                      <h2 className="text-xl font-semibold">Overall Status</h2>
                      <p className="text-sm text-gray-600">
                        Diagnostic completed at {formatTimestamp(diagnostics.timestamp)}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant={getOverallStatus() === "success" ? "default" : "destructive"}
                    className={getOverallStatus() === "success" ? "bg-green-600" : ""}
                  >
                    {getOverallStatus() === "success" ? "Success" : "Failed"}
                  </Badge>
                </div>

                {diagnostics.database.success && (
                  <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center gap-2 text-green-700">
                      <CheckCircle className="h-4 w-4" />
                      <span className="text-sm">
                        ✅ Success! The database connection is correctly routed through the Fixie SOCKS proxy.
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Proxy Configuration */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Proxy Configuration
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Using Proxy:</span>
                    <Badge variant={diagnostics.proxy.enabled ? "default" : "secondary"}>
                      {diagnostics.proxy.enabled ? "Yes" : "No"}
                    </Badge>
                  </div>
                  {diagnostics.proxy.enabled && (
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Fixie URL (Masked):</span>
                      <code className="text-sm bg-gray-100 px-2 py-1 rounded">{diagnostics.proxy.url}</code>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Database Connection Details */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Database Connection Details</CardTitle>
                  <Badge
                    variant={diagnostics.database.success ? "default" : "destructive"}
                    className={diagnostics.database.success ? "bg-green-600" : ""}
                  >
                    {diagnostics.database.success ? "Connected" : "Failed"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm">
                    {diagnostics.database.success ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-600" />
                    )}
                    <span>{diagnostics.database.message}</span>
                  </div>

                  {getClientIP() && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-medium mb-2">Client IP Address Seen by SQL Server:</h4>
                      <div className="flex items-center gap-2">
                        <code className="text-lg font-mono bg-white px-3 py-2 rounded border">{getClientIP()}</code>
                        {isFixieIP(getClientIP()!) && (
                          <Badge variant="default" className="bg-green-600">
                            ✓ Matches Fixie IP
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {!diagnostics && !loading && (
          <Card>
            <CardContent className="p-8 text-center">
              <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Ready to Run Diagnostics</h3>
              <p className="text-gray-600 mb-4">
                Click "Run Diagnostics" to test your database connection and proxy configuration.
              </p>
              <Button onClick={runDiagnostics} disabled={loading}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Run Diagnostics
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
