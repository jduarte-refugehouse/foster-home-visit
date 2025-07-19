"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Database, RefreshCw, CheckCircle, XCircle, ArrowLeft, Info, Home, Server, Table } from "lucide-react"
import Link from "next/link"

interface DatabaseTestResult {
  success: boolean
  message: string
  timestamp?: string
  connectionInfo?: any
  connectionTest?: any[]
  databaseInfo?: any[]
  tableList?: any[]
  syncActiveHomesDisplay?: {
    success: boolean
    error?: string
    data: any[]
    count: number
  }
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
      console.log("Starting database test...")
      const response = await fetch("/api/test-db")
      const data = await response.json()
      console.log("Database test result:", data)
      setResult(data)
    } catch (error) {
      console.error("Database test error:", error)
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
                <span className="text-lg font-semibold text-gray-900">Database Connection Test</span>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Link href="/homes">
                <Button variant="outline">
                  <Home className="w-4 h-4 mr-2" />
                  View Homes
                </Button>
              </Link>
              <Button onClick={testDatabase} disabled={loading}>
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                {loading ? "Testing..." : "Test Again"}
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Azure SQL Database Connection Test</h1>
            <p className="text-gray-600">Testing connection using Key Vault connection string parsing</p>
          </div>

          {loading && (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <div className="text-center">
                  <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
                  <p className="text-gray-600">Testing database connection...</p>
                  <p className="text-sm text-gray-500 mt-2">Parsing connection string and establishing connection...</p>
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
                    <div className="flex items-center space-x-2">
                      <Badge variant={result.success ? "default" : "destructive"}>
                        {result.success ? "Connected" : "Failed"}
                      </Badge>
                      {result.timestamp && (
                        <Badge variant="outline" className="text-xs">
                          {new Date(result.timestamp).toLocaleTimeString()}
                        </Badge>
                      )}
                    </div>
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

              {/* Connection Info */}
              {result.connectionInfo && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Server className="w-5 h-5 mr-2" />
                      Connection Configuration
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="text-sm">
                          <strong>Server:</strong> {result.connectionInfo.server || "N/A"}
                        </div>
                        <div className="text-sm">
                          <strong>Database:</strong> {result.connectionInfo.database || "N/A"}
                        </div>
                        <div className="text-sm">
                          <strong>User:</strong> {result.connectionInfo.user || "N/A"}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="text-sm">
                          <strong>Encryption:</strong>{" "}
                          <Badge variant={result.connectionInfo.encrypt ? "default" : "secondary"}>
                            {result.connectionInfo.encrypt ? "Enabled" : "Disabled"}
                          </Badge>
                        </div>
                        <div className="text-sm">
                          <strong>Pool Connected:</strong>{" "}
                          <Badge variant={result.connectionInfo.poolConnected ? "default" : "secondary"}>
                            {result.connectionInfo.poolConnected ? "Yes" : "No"}
                          </Badge>
                        </div>
                        <div className="text-sm">
                          <strong>Connection Timeout:</strong> {result.connectionInfo.connectionTimeout || "N/A"}ms
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Database Info */}
              {result.databaseInfo && result.databaseInfo.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Info className="w-5 h-5 mr-2" />
                      Database Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {result.databaseInfo.map((info, index) => (
                        <div key={index} className="space-y-2">
                          <div className="text-sm">
                            <strong>Database:</strong> {info.database_name}
                          </div>
                          <div className="text-sm">
                            <strong>Server:</strong> {info.server_name}
                          </div>
                          <div className="text-sm">
                            <strong>User:</strong> {info.current_user}
                          </div>
                          <div className="text-sm">
                            <strong>Language:</strong> {info.language_setting}
                          </div>
                          <div className="text-sm">
                            <strong>Current Time:</strong> {new Date(info.current_time).toLocaleString()}
                          </div>
                          <div className="text-sm">
                            <strong>SQL Version:</strong> {info.sql_version?.substring(0, 50)}...
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Table List */}
              {result.tableList && result.tableList.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Table className="w-5 h-5 mr-2" />
                      Available Tables ({result.tableList.length} found)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                      {result.tableList.map((table, index) => (
                        <div key={index} className="text-sm bg-gray-50 p-2 rounded">
                          <strong>
                            {table.TABLE_SCHEMA}.{table.TABLE_NAME}
                          </strong>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Query Results - Same as before but with better styling */}
              {result.syncActiveHomesDisplay && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>SyncActiveHomesDisplay Query</CardTitle>
                        <CardDescription>SELECT TOP 10 * FROM dbo.SyncActiveHomesDisplay</CardDescription>
                      </div>
                      <Badge variant={result.syncActiveHomesDisplay.success ? "default" : "destructive"}>
                        {result.syncActiveHomesDisplay.success
                          ? `${result.syncActiveHomesDisplay.count} rows`
                          : "Error"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {result.syncActiveHomesDisplay.error ? (
                      <Alert>
                        <XCircle className="h-4 w-4" />
                        <AlertDescription>{result.syncActiveHomesDisplay.error}</AlertDescription>
                      </Alert>
                    ) : result.syncActiveHomesDisplay.data && result.syncActiveHomesDisplay.data.length > 0 ? (
                      <div className="space-y-3">
                        <p className="text-sm text-gray-600">Found {result.syncActiveHomesDisplay.count} records:</p>
                        <div className="space-y-2 max-h-96 overflow-y-auto">
                          {result.syncActiveHomesDisplay.data.map((row, index) => (
                            <Card key={index} className="bg-gray-50">
                              <CardContent className="pt-3 pb-3">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-1 text-xs">
                                  {Object.entries(row)
                                    .slice(0, 12)
                                    .map(([key, value]) => (
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
                    ) : (
                      <p className="text-gray-500">No data found in SyncActiveHomesDisplay table</p>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* SyncActiveHomes Query Results */}
              {result.syncActiveHomes && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>SyncActiveHomes Query</CardTitle>
                        <CardDescription>SELECT TOP 5 * FROM dbo.SyncActiveHomes</CardDescription>
                      </div>
                      <Badge variant={result.syncActiveHomes.success ? "default" : "destructive"}>
                        {result.syncActiveHomes.success ? `${result.syncActiveHomes.count} rows` : "Error"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {result.syncActiveHomes.error ? (
                      <Alert>
                        <XCircle className="h-4 w-4" />
                        <AlertDescription>{result.syncActiveHomes.error}</AlertDescription>
                      </Alert>
                    ) : result.syncActiveHomes.data && result.syncActiveHomes.data.length > 0 ? (
                      <div className="space-y-3">
                        <p className="text-sm text-gray-600">Found {result.syncActiveHomes.count} records:</p>
                        <div className="space-y-2">
                          {result.syncActiveHomes.data.map((row, index) => (
                            <Card key={index} className="bg-blue-50">
                              <CardContent className="pt-3 pb-3">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-1 text-xs">
                                  {Object.entries(row)
                                    .slice(0, 12)
                                    .map(([key, value]) => (
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
                    ) : (
                      <p className="text-gray-500">No data found in SyncActiveHomes table</p>
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
