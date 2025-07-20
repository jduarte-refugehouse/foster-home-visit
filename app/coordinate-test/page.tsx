"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, Database, CheckCircle, XCircle, RefreshCw } from "lucide-react"
import Link from "next/link"

interface TestResult {
  success: boolean
  data?: any[]
  count?: number
  error?: string
}

interface CoordinateTestData {
  success: boolean
  timestamp: string
  tests: {
    availableColumns?: TestResult
    coordinatesOnly?: TestResult
    explicitSchema?: TestResult
    permissions?: TestResult
    basicSelect?: TestResult
    userContext?: TestResult
  }
  error?: string
}

export default function CoordinateTestPage() {
  const [result, setResult] = useState<CoordinateTestData | null>(null)
  const [loading, setLoading] = useState(false)

  const runTest = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/test-coordinates")
      const data = await response.json()
      setResult(data)
    } catch (error) {
      setResult({
        success: false,
        timestamp: new Date().toISOString(),
        tests: {},
        error: error instanceof Error ? error.message : "Unknown error",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    runTest()
  }, [])

  const renderTestResult = (testName: string, test: TestResult | undefined) => {
    if (!test) return null

    return (
      <Card key={testName} className={test.success ? "border-green-200" : "border-red-200"}>
        <CardHeader>
          <CardTitle className="flex items-center text-sm">
            {test.success ? (
              <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
            ) : (
              <XCircle className="w-4 h-4 text-red-500 mr-2" />
            )}
            {testName}
            {test.count !== undefined && <Badge className="ml-2">{test.count} records</Badge>}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {test.success ? (
            <div className="space-y-2">
              {test.data && test.data.length > 0 && (
                <div className="bg-gray-50 p-3 rounded text-xs font-mono max-h-40 overflow-y-auto">
                  <pre>{JSON.stringify(test.data, null, 2)}</pre>
                </div>
              )}
            </div>
          ) : (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription className="text-sm">{test.error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
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
                <span className="text-lg font-semibold text-gray-900">Coordinate Column Test</span>
              </div>
            </div>
            <Button onClick={runTest} disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              {loading ? "Testing..." : "Run Test"}
            </Button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Coordinate Column Access Test</h1>
            <p className="text-gray-600">Testing if we can access the Latitude and Longitude columns</p>
          </div>

          {loading && (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <div className="text-center">
                  <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
                  <p className="text-gray-600">Running coordinate access tests...</p>
                </div>
              </CardContent>
            </Card>
          )}

          {result && !loading && (
            <div className="space-y-6">
              {result.error && (
                <Alert variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertDescription>{result.error}</AlertDescription>
                </Alert>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {renderTestResult("Available Columns", result.tests.availableColumns)}
                {renderTestResult("Coordinates Only", result.tests.coordinatesOnly)}
                {renderTestResult("Explicit Schema", result.tests.explicitSchema)}
                {renderTestResult("User Permissions", result.tests.permissions)}
                {renderTestResult("Basic Select", result.tests.basicSelect)}
                {renderTestResult("User Context", result.tests.userContext)}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
