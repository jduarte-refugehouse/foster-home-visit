"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Database, RefreshCw, CheckCircle, XCircle, ArrowLeft, Lightbulb, Settings } from "lucide-react"
import Link from "next/link"

interface DbTestResult {
  success: boolean
  message: string
  data?: {
    login_name: string
    db_name: string
    client_ip: string
  }[]
}

interface DiagnosticResult {
  success: boolean
  timestamp: string
  usingProxy: boolean
  fixieUrlMasked: string
  dbConnectionTest: DbTestResult
  analysis: string
  error?: string
}

export default function Diagnostics() {
  const [result, setResult] = useState<DiagnosticResult | null>(null)
  const [loading, setLoading] = useState(false)

  const runDiagnostics = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/diagnostics")
      const data = await response.json()
      setResult(data)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error"
      setResult({
        success: false,
        timestamp: new Date().toISOString(),
        usingProxy: false,
        fixieUrlMasked: "N/A",
        dbConnectionTest: {
          success: false,
          message: `The diagnostics API failed to respond: ${errorMessage}`,
        },
        analysis: "The diagnostics API failed to respond. This indicates a server-side error.",
        error: errorMessage,
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    runDiagnostics()
  }, [])

  const getStatusCard = () => {
    if (!result) return null
    const isSuccess = result.success

    return (
      <Card className={isSuccess ? "border-green-200" : "border-red-200"}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              {isSuccess ? (
                <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
              ) : (
                <XCircle className="w-5 h-5 text-red-500 mr-2" />
              )}
              Overall Status
            </CardTitle>
            <Badge variant={isSuccess ? "default" : "destructive"}>{isSuccess ? "Success" : "Failed"}</Badge>
          </div>
          <CardDescription>Diagnostic completed at {new Date(result.timestamp).toLocaleString()}</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant={isSuccess ? "default" : "destructive"}>
            {isSuccess ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
            <AlertDescription>
              <strong>Analysis:</strong> {result.analysis}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  const clientIP = result?.dbConnectionTest.data?.[0]?.client_ip
  const fixieStaticIPs = ["3.224.144.155", "3.223.196.67"]
  const isFixieIP = clientIP && fixieStaticIPs.includes(clientIP)

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
                <Settings className="w-6 h-6 text-blue-600" />
                <span className="text-lg font-semibold text-gray-900">Connection Diagnostics</span>
              </div>
            </div>
            <Button onClick={runDiagnostics} disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              {loading ? "Running..." : "Run Diagnostics"}
            </Button>
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Connection Diagnostics</h1>
            <p className="text-gray-600">Testing the database connection via the Fixie SOCKS proxy.</p>
          </div>

          {loading && (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <div className="text-center">
                  <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
                  <p className="text-gray-600">Testing database connection...</p>
                </div>
              </CardContent>
            </Card>
          )}

          {result && !loading && (
            <div className="space-y-6">
              {getStatusCard()}

              {/* Proxy Configuration */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Settings className="w-5 h-5 mr-2" />
                    Proxy Configuration
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm">
                    <strong>Using Proxy:</strong>{" "}
                    <Badge variant={result.usingProxy ? "default" : "secondary"}>
                      {result.usingProxy ? "Yes" : "No"}
                    </Badge>
                  </div>
                  <div className="text-sm mt-2">
                    <strong>Fixie URL (Masked):</strong>{" "}
                    <code className="bg-gray-100 p-1 rounded">{result.fixieUrlMasked}</code>
                  </div>
                </CardContent>
              </Card>

              {/* Database Connection Test */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center">
                      <Database className="w-5 h-5 mr-2" />
                      Database Connection Details
                    </CardTitle>
                    <Badge variant={result.dbConnectionTest.success ? "default" : "destructive"}>
                      {result.dbConnectionTest.success ? "Connected" : "Failed"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <Alert variant={result.dbConnectionTest.success ? "default" : "destructive"}>
                    {result.dbConnectionTest.success ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      <XCircle className="h-4 w-4" />
                    )}
                    <AlertDescription>{result.dbConnectionTest.message}</AlertDescription>
                  </Alert>
                  {clientIP && (
                    <div className="mt-4 p-4 bg-gray-100 rounded-lg">
                      <h4 className="font-semibold text-gray-800">Client IP Address Seen by SQL Server:</h4>
                      <div className="flex items-center mt-2">
                        <p className="text-lg font-mono mr-4">{clientIP}</p>
                        {isFixieIP ? (
                          <Badge className="bg-green-100 text-green-800">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Matches Fixie IP
                          </Badge>
                        ) : (
                          <Badge variant="destructive">
                            <XCircle className="w-3 h-3 mr-1" />
                            Does NOT Match Fixie IP
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Recommendations */}
              {!result.success && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Lightbulb className="w-5 h-5 mr-2" />
                      Troubleshooting Steps
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 list-disc list-inside text-sm">
                      <li>
                        Ensure the `FIXIE_SOCKS_HOST` environment variable in Vercel is set correctly with your
                        username, password, host, and port.
                      </li>
                      <li>
                        Verify both Fixie outbound IPs (`3.224.144.155`, `3.223.196.67`) are added to your Azure SQL
                        firewall rules.
                      </li>
                      <li>Check your Fixie dashboard for any service alerts or issues.</li>
                      <li>
                        If the connection works but the IP is wrong, it means the proxy is not being used. Double-check
                        the `FIXIE_SOCKS_HOST` variable name and value.
                      </li>
                    </ul>
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
