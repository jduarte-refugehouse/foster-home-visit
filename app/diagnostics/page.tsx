"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Database,
  RefreshCw,
  CheckCircle,
  XCircle,
  ArrowLeft,
  Info,
  Globe,
  Key,
  AlertTriangle,
  Lightbulb,
  Settings,
} from "lucide-react"
import Link from "next/link"

interface DiagnosticResult {
  success: boolean
  timestamp: string
  currentIP: string
  vercelRegion?: string
  keyVaultTest: {
    success: boolean
    error?: string
  }
  dbConnectionTest: {
    success: boolean
    error?: string
    details?: string
  }
  errorAnalysis?: string
  recommendations?: string[]
  error?: string
}

export default function Diagnostics() {
  const [result, setResult] = useState<DiagnosticResult | null>(null)
  const [loading, setLoading] = useState(false)

  const runDiagnostics = async () => {
    setLoading(true)
    try {
      console.log("Running connection diagnostics...")
      const response = await fetch("/api/connection-debug")
      const data = await response.json()
      console.log("Diagnostic result:", data)
      setResult(data)
    } catch (error) {
      console.error("Diagnostic error:", error)
      setResult({
        success: false,
        timestamp: new Date().toISOString(),
        currentIP: "Unknown",
        keyVaultTest: { success: false, error: "Failed to run diagnostics" },
        dbConnectionTest: { success: false, error: "Failed to run diagnostics" },
        error: error instanceof Error ? error.message : "Unknown error",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    runDiagnostics()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link href="/">
                <Button variant="ghost">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Home
                </Button>
              </Link>
              <div className="flex items-center space-x-2">
                <Database className="w-6 h-6 text-blue-600" />
                <span className="text-lg font-semibold text-gray-900">Connection Diagnostics</span>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Link href="/ip-management">
                <Button variant="outline">
                  <Settings className="w-4 h-4 mr-2" />
                  Fix IP Issue
                </Button>
              </Link>
              <Button onClick={runDiagnostics} disabled={loading}>
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                {loading ? "Running..." : "Run Diagnostics"}
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Connection Diagnostics</h1>
            <p className="text-gray-600">Comprehensive analysis of Azure SQL connection issues</p>
          </div>

          {loading && (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <div className="text-center">
                  <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
                  <p className="text-gray-600">Running comprehensive diagnostics...</p>
                  <p className="text-sm text-gray-500 mt-2">Checking IP, Key Vault, and database connection...</p>
                </div>
              </CardContent>
            </Card>
          )}

          {result && !loading && (
            <div className="space-y-6">
              {/* Overall Status */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center">
                      {result.success ? (
                        <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-500 mr-2" />
                      )}
                      Overall Status
                    </CardTitle>
                    <Badge variant={result.success ? "default" : "destructive"}>
                      {result.success ? "All Systems Operational" : "Issues Detected"}
                    </Badge>
                  </div>
                  <CardDescription>
                    Diagnostic completed at {new Date(result.timestamp).toLocaleString()}
                  </CardDescription>
                </CardHeader>
              </Card>

              {/* IP Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Globe className="w-5 h-5 mr-2" />
                    Network Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-700">Current IP Address</p>
                      <p className="text-lg font-mono bg-gray-100 p-2 rounded">{result.currentIP}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">Vercel Region</p>
                      <p className="text-lg">{result.vercelRegion || "Unknown"}</p>
                    </div>
                  </div>
                  <Alert className="mt-4">
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Important:</strong> Vercel functions run on rotating IP addresses. Your Azure SQL firewall
                      must allow this IP address: <code className="bg-gray-100 px-1 rounded">{result.currentIP}</code>
                    </AlertDescription>
                  </Alert>
                  {!result.success && (
                    <div className="mt-4">
                      <Link href="/ip-management">
                        <Button>
                          <Settings className="w-4 h-4 mr-2" />
                          Fix IP Address Issue
                        </Button>
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Key Vault Test */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center">
                      <Key className="w-5 h-5 mr-2" />
                      Azure Key Vault Access
                    </CardTitle>
                    <Badge variant={result.keyVaultTest.success ? "default" : "destructive"}>
                      {result.keyVaultTest.success ? "Success" : "Failed"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {result.keyVaultTest.success ? (
                    <p className="text-green-600">✅ Successfully retrieved connection string from Key Vault</p>
                  ) : (
                    <Alert>
                      <XCircle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Key Vault Error:</strong> {result.keyVaultTest.error}
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>

              {/* Database Connection Test */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center">
                      <Database className="w-5 h-5 mr-2" />
                      Database Connection Test
                    </CardTitle>
                    <Badge variant={result.dbConnectionTest.success ? "default" : "destructive"}>
                      {result.dbConnectionTest.success ? "Connected" : "Failed"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {result.dbConnectionTest.success ? (
                    <div>
                      <p className="text-green-600 mb-2">✅ Database connection successful</p>
                      <p className="text-sm text-gray-600">{result.dbConnectionTest.details}</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <Alert>
                        <XCircle className="h-4 w-4" />
                        <AlertDescription>
                          <strong>Connection Error:</strong> {result.dbConnectionTest.error}
                        </AlertDescription>
                      </Alert>

                      {result.errorAnalysis && (
                        <Alert>
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription>
                            <strong>Analysis:</strong> {result.errorAnalysis}
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Recommendations */}
              {result.recommendations && result.recommendations.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Lightbulb className="w-5 h-5 mr-2" />
                      Recommendations
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {result.recommendations.map((rec, index) => (
                        <li key={index} className="flex items-start">
                          <span className="text-blue-500 mr-2">•</span>
                          <span className="text-sm">{rec}</span>
                        </li>
                      ))}
                    </ul>

                    {!result.success && (
                      <Alert className="mt-4">
                        <Lightbulb className="h-4 w-4" />
                        <AlertDescription>
                          <strong>Quick Fix:</strong> Use our IP Management tool to automatically add the current IP
                          address to your Azure SQL firewall rules.
                        </AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
