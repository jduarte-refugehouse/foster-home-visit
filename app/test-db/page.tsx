"use client"

import { Badge } from "@/components/ui/badge"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, XCircle, RefreshCw, ArrowLeft } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

const LOGO_SRC = "/images/web logo with name.png"

interface TestResult {
  success: boolean
  message: string
  data?: any
  error?: string
}

export default function TestDbPage() {
  const [result, setResult] = useState<TestResult | null>(null)
  const [loading, setLoading] = useState(false)

  const runTest = async () => {
    setLoading(true)
    setResult(null) // Clear previous results
    try {
      const response = await fetch("/api/test-db")
      const data = await response.json()
      setResult(data)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error"
      setResult({
        success: false,
        message: `Failed to connect to the test endpoint: ${errorMessage}`,
        error: errorMessage,
      })
    } finally {
      setLoading(false)
    }
  }

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
                <Image
                  src={LOGO_SRC || "/placeholder.svg"}
                  alt="Family Visits Pro Logo"
                  width={180}
                  height={36}
                  className="h-auto"
                />
                <span className="text-lg font-semibold text-gray-900">Database Connection Test</span>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Test Database Connection</h1>
            <p className="text-gray-600">Click the button below to test the connection to your Azure SQL database.</p>
          </div>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Run Connection Test</CardTitle>
              <CardDescription>This will attempt to connect to the database and fetch a simple query.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={runTest} disabled={loading} className="w-full">
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Testing...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Test Connection
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {result && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Test Result</CardTitle>
                  <Badge variant={result.success ? "default" : "destructive"}>
                    {result.success ? "Success" : "Failed"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <Alert variant={result.success ? "default" : "destructive"}>
                  {result.success ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                  <AlertDescription>{result.message}</AlertDescription>
                </Alert>
                {result.data && (
                  <div className="mt-4 p-4 bg-gray-100 rounded-lg text-sm overflow-x-auto">
                    <h4 className="font-semibold mb-2">Response Data:</h4>
                    <pre className="whitespace-pre-wrap break-all">{JSON.stringify(result.data, null, 2)}</pre>
                  </div>
                )}
                {result.error && (
                  <div className="mt-4 p-4 bg-red-50 rounded-lg text-sm overflow-x-auto">
                    <h4 className="font-semibold mb-2 text-red-800">Error Details:</h4>
                    <pre className="whitespace-pre-wrap break-all text-red-700">{result.error}</pre>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <div className="mt-8 text-center">
            <Link href="/diagnostics">
              <Button variant="outline">
                <RefreshCw className="w-4 h-4 mr-2" />
                Run Full Diagnostics
              </Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
