"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Database, RefreshCw, CheckCircle, ArrowLeft, Settings } from "lucide-react"
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
  const [loading, setLoading] = useState(true)

  const runDiagnostics = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/diagnostics")
      if (!response.ok) {
        throw new Error(`API responded with status ${response.status}`)
      }
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
        analysis: "The diagnostics API failed to respond. This could indicate a server-side error or a network issue.",
        error: errorMessage,
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    runDiagnostics()
  }, [])

  const clientIP = result?.dbConnectionTest.data?.[0]?.client_ip
  const isFixieIP = clientIP && ["3.224.144.155", "3.223.196.67"].includes(clientIP)

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center text-sm font-medium text-gray-600 hover:text-gray-900">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Link>
            <Button onClick={runDiagnostics} disabled={loading} className="bg-gray-900 text-white hover:bg-gray-800">
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              {loading ? "Running..." : "Run Diagnostics"}
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto py-8 sm:px-6 lg:px-8">
        <div className="px-4 sm:px-0">
          <h1 className="text-3xl font-bold text-gray-900">Connection Diagnostics</h1>
          <p className="mt-1 text-sm text-gray-600">Testing the database connection via the Fixie SOCKS proxy.</p>
        </div>

        <div className="mt-8">
          {loading ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-20">
                <RefreshCw className="w-10 h-10 animate-spin text-blue-600" />
                <p className="mt-4 text-gray-600">Running diagnostics...</p>
              </CardContent>
            </Card>
          ) : (
            result && (
              <div className="space-y-6">
                <Card className="border-green-300 bg-white shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center">
                        <CheckCircle className="w-6 h-6 text-green-500 mr-3" />
                        <span className="text-xl">Overall Status</span>
                      </div>
                      <Badge className="bg-gray-900 text-white text-xs font-semibold">
                        {result.success ? "Success" : "Failed"}
                      </Badge>
                    </CardTitle>
                    <CardContent className="pt-4 px-0 pb-0">
                      <p className="text-sm text-gray-500">
                        Diagnostic completed at {new Date(result.timestamp).toLocaleString()}
                      </p>
                      <Alert className="mt-4 border-gray-200 bg-gray-50">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <AlertDescription className="text-gray-800">
                          <strong>Analysis:</strong> {result.analysis}
                        </AlertDescription>
                      </Alert>
                    </CardContent>
                  </CardHeader>
                </Card>

                <Card className="bg-white shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center text-xl">
                      <Settings className="w-5 h-5 mr-3 text-gray-500" />
                      Proxy Configuration
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Using Proxy:</span>
                      <Badge className="bg-gray-900 text-white text-xs font-semibold">
                        {result.usingProxy ? "Yes" : "No"}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Fixie URL (Masked):</span>
                      <code className="bg-gray-100 text-gray-800 px-2 py-1 rounded-md">{result.fixieUrlMasked}</code>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center text-xl">
                        <Database className="w-5 h-5 mr-3 text-gray-500" />
                        Database Connection Details
                      </div>
                      <Badge className="bg-gray-900 text-white text-xs font-semibold">
                        {result.dbConnectionTest.success ? "Connected" : "Failed"}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Alert variant={result.dbConnectionTest.success ? "default" : "destructive"} className="bg-gray-50">
                      <CheckCircle className="h-4 w-4" />
                      <AlertDescription>{result.dbConnectionTest.message}</AlertDescription>
                    </Alert>
                    {clientIP && (
                      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                        <h4 className="text-sm font-medium text-gray-600">Client IP Address Seen by SQL Server:</h4>
                        <div className="flex items-center justify-between mt-2">
                          <p className="text-2xl font-mono text-gray-800">{clientIP}</p>
                          <Badge className={isFixieIP ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                            <CheckCircle className="w-3 h-3 mr-1.5" />
                            Matches Fixie IP
                          </Badge>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )
          )}
        </div>
      </main>
    </div>
  )
}
