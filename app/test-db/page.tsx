"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Database, RefreshCw, CheckCircle, XCircle, ArrowLeft } from "lucide-react"
import Link from "next/link"

interface DatabaseTestResult {
  success: boolean
  message: string
  connectionTest?: any[]
  databaseInfo?: any[]
  syncActiveHomes?: {
    success: boolean
    error?: string
    data: any[]
    count: number
  }
  error?: string
}

export default function TestDatabase() {
  const [result, setResult] = useState<DatabaseTestResult | null>(null)
  const [loading, setLoading] = useState(false)

  const testDatabase = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/test-db")
      const data = await response.json()
      setResult(data)
    } catch (error) {
      setResult({
        success: false,
        message: "Failed to connect to API",
        error: error instanceof Error ? error.message : "Unknown error",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    testDatabase()
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
                <span className="text-lg font-semibold text-gray-900">Database Test</span>
              </div>
            </div>
            <Button onClick={testDatabase} disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              {loading ? "Testing..." : "Test Again"}
            </Button>
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Database Connection Test</h1>
            <p className="text-gray-600">
              Testing connection to Azure SQL Database and querying SyncActiveHomesDisplay
            </p>
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
              {/* Connection Status */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center">
                      {result.success ? (
                        <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-500 mr-2" />
                      )}
                      Connection Status
                    </CardTitle>
                    <Badge variant={result.success ? "default" : "destructive"}>
                      {result.success ? "Connected" : "Failed"}
                    </Badge>
                  </div>
                  <CardDescription>{result.message}</CardDescription>
                </CardHeader>
                {result.error && (
                  <CardContent>
                    <Alert>
                      <XCircle className="h-4 w-4" />
                      <AlertDescription>{result.error}</AlertDescription>
                    </Alert>
                  </CardContent>
                )}
              </Card>

              {/* Database Info */}
              {result.databaseInfo && (
                <Card>
                  <CardHeader>
                    <CardTitle>Database Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {result.databaseInfo.map((info, index) => (
                        <div key={index} className="grid grid-cols-1 gap-2">
                          <div className="text-sm">
                            <strong>Database:</strong> {info.database_name}
                          </div>
                          <div className="text-sm">
                            <strong>Current Time:</strong> {new Date(info.current_time).toLocaleString()}
                          </div>
                          <div className="text-sm">
                            <strong>SQL Version:</strong> {info.sql_version?.substring(0, 100)}...
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* SyncActiveHomesDisplay Query Results */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>SyncActiveHomesDisplay Query</CardTitle>
                      <CardDescription>SELECT TOP 10 * FROM dbo.SyncActiveHomesDisplay</CardDescription>
                    </div>
                    {result.syncActiveHomes && (
                      <Badge variant={result.syncActiveHomes.success ? "default" : "destructive"}>
                        {result.syncActiveHomes.success ? `${result.syncActiveHomes.count} rows` : "Error"}
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {result.syncActiveHomes?.error ? (
                    <Alert>
                      <XCircle className="h-4 w-4" />
                      <AlertDescription>{result.syncActiveHomes.error}</AlertDescription>
                    </Alert>
                  ) : result.syncActiveHomes?.data && result.syncActiveHomes.data.length > 0 ? (
                    <div className="space-y-4">
                      <p className="text-sm text-gray-600">
                        Found {result.syncActiveHomes.count} records in SyncActiveHomesDisplay table:
                      </p>
                      <div className="overflow-x-auto">
                        <div className="space-y-3">
                          {result.syncActiveHomes.data.map((row, index) => (
                            <Card key={index} className="bg-gray-50">
                              <CardContent className="pt-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 text-sm">
                                  {Object.entries(row).map(([key, value]) => (
                                    <div key={key} className="truncate">
                                      <strong className="text-gray-700">{key}:</strong>{" "}
                                      <span className="text-gray-900">{value === null ? "NULL" : String(value)}</span>
                                    </div>
                                  ))}
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-500">No data found in SyncActiveHomesDisplay table</p>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
