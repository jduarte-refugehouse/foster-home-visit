"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { RefreshCw, Database, CheckCircle, XCircle, AlertCircle } from "lucide-react"

interface DatabaseTestResult {
  success: boolean
  message: string
  data?: Array<{
    login_name: string
    db_name: string
    client_ip: string
  }>
  passwordSource?: string
  passwordError?: string
  timestamp: string
  error?: string
}

export default function TestDbPage() {
  const [result, setResult] = useState<DatabaseTestResult | null>(null)
  const [loading, setLoading] = useState(false)

  const runTest = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/test-db")
      const data = await response.json()
      setResult(data)
    } catch (error) {
      setResult({
        success: false,
        message: "Network error occurred",
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : "Unknown error",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    runTest()
  }, [])

  const getStatusIcon = () => {
    if (!result) return <AlertCircle className="h-5 w-5 text-gray-400" />
    return result.success ? (
      <CheckCircle className="h-5 w-5 text-green-600" />
    ) : (
      <XCircle className="h-5 w-5 text-red-600" />
    )
  }

  const getStatusBadge = () => {
    if (!result) return <Badge variant="secondary">UNKNOWN</Badge>
    return result.success ? <Badge variant="default">CONNECTED</Badge> : <Badge variant="destructive">FAILED</Badge>
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Database Connection Test</h1>
        <Button onClick={runTest} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Test Connection
        </Button>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {getStatusIcon()}
            Connection Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading && (
            <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
              <p>Testing database connection...</p>
            </div>
          )}

          {!loading && result && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                {getStatusBadge()}
                <span className="text-sm text-gray-600">{result.message}</span>
              </div>

              {result.passwordSource && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-blue-800">
                    🔑 Password Source: <strong>{result.passwordSource}</strong>
                  </p>
                  {result.passwordError && <p className="text-red-600 text-sm mt-2">Error: {result.passwordError}</p>}
                </div>
              )}

              {result.success && result.data && result.data.length > 0 && (
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-green-800 mb-2">Connection Details:</h4>
                  <div className="space-y-1 text-sm text-green-700">
                    <p>
                      <strong>Login:</strong> {result.data[0].login_name}
                    </p>
                    <p>
                      <strong>Database:</strong> {result.data[0].db_name}
                    </p>
                    <p>
                      <strong>Client IP:</strong> {result.data[0].client_ip}
                    </p>
                  </div>
                </div>
              )}

              {!result.success && (
                <div className="bg-red-50 p-4 rounded-lg">
                  <p className="text-red-800">❌ {result.error}</p>
                </div>
              )}

              <div className="text-xs text-gray-500">
                Test completed at: {new Date(result.timestamp).toLocaleString()}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            About This Test
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-gray-600">
            <p>This test verifies:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Azure Key Vault password retrieval</li>
              <li>Fixie SOCKS proxy connection (if configured)</li>
              <li>SQL Server database connectivity</li>
              <li>Authentication and authorization</li>
              <li>Basic query execution</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
