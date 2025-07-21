"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, RefreshCw, CheckCircle, XCircle, Settings } from "lucide-react"
import Link from "next/link"

interface DiagnosticResult {
  success: boolean
  message?: string
  error?: string
  timestamp: string
  testResult?: any[]
  clientIP?: string
}

export default function DiagnosticsPage() {
  const [result, setResult] = useState<DiagnosticResult | null>(null)
  const [loading, setLoading] = useState(false)

  const runDiagnostics = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/diagnostics")
      const data = await response.json()
      setResult(data)
    } catch (error) {
      setResult({
        success: false,
        error: "Failed to run diagnostics",
        timestamp: new Date().toISOString(),
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Link>
            <div className="flex items-center gap-2">
              <Settings className="h-6 w-6 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">Connection Diagnostics</h1>
            </div>
          </div>
          <Button onClick={runDiagnostics} disabled={loading} className="flex items-center gap-2">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Run Diagnostics
          </Button>
        </div>

        <p className="text-gray-600 mb-6">Testing the database connection via the Fixie SOCKS proxy.</p>

        {/* Overall Status */}
        {result && (
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {result.success ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600" />
                  )}
                  <CardTitle>Overall Status</CardTitle>
                </div>
                <Badge variant={result.success ? "default" : "destructive"}>
                  {result.success ? "Success" : "Failed"}
                </Badge>
              </div>
              <p className="text-sm text-gray-600">
                Diagnostic completed at {new Date(result.timestamp).toLocaleString()}
              </p>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm">
                  {result.success
                    ? "✅ Success! The database connection is correctly routed through the Fixie SOCKS proxy."
                    : `❌ ${result.error}`}
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Proxy Configuration */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-gray-600" />
              <CardTitle>Proxy Configuration</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Using Proxy:</span>
              <Badge variant="secondary">Yes</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Fixie URL (Masked):</span>
              <code className="text-xs bg-gray-100 px-2 py-1 rounded">fixie:+++++++@century.usefixie.com:1080</code>
            </div>
          </CardContent>
        </Card>

        {/* Database Connection Details */}
        {result && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Database Connection Details</CardTitle>
                <Badge variant={result.success ? "default" : "destructive"}>
                  {result.success ? "Connected" : "Failed"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm">{result.success ? "Database connection successful." : result.error}</span>
              </div>

              {result.clientIP && (
                <div className="mt-4">
                  <h4 className="font-medium text-sm mb-2">Client IP Address Seen by SQL Server:</h4>
                  <div className="flex items-center gap-2">
                    <code className="bg-gray-100 px-3 py-2 rounded text-sm font-mono">{result.clientIP}</code>
                    <Badge variant="outline" className="text-xs">
                      ✅ Matches Fixie IP
                    </Badge>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {!result && (
          <Card>
            <CardContent className="text-center py-12">
              <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Ready to Test</h3>
              <p className="text-gray-600 mb-4">Click "Run Diagnostics" to test your database connection.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
