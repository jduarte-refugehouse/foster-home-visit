"use client"

import { useEffect } from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { RefreshCw, CheckCircle, XCircle } from "lucide-react"

export default function TestDbPage() {
  const [testResult, setTestResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const handleTestDb = async () => {
    setLoading(true)
    setTestResult(null)
    try {
      const response = await fetch("/api/test-db")
      const data = await response.json()
      setTestResult(data)
    } catch (error: any) {
      setTestResult({ success: false, error: error.message })
    } finally {
      setLoading(false)
    }
  }

  const handleReconnectDb = async () => {
    setLoading(true)
    setTestResult(null) // Clear previous test result
    try {
      const response = await fetch("/api/reconnect")
      const data = await response.json()
      setTestResult(data) // Show reconnection result
      if (data.success) {
        // If reconnection is successful, immediately test the DB again
        await handleTestDb()
      }
    } catch (error: any) {
      setTestResult({ success: false, error: error.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-center mb-8">Database Connection Test</h1>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Test Database Connectivity</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Click the button below to test the connection to your configured database.
          </p>
          <div className="flex space-x-4">
            <Button onClick={handleTestDb} disabled={loading}>
              {loading ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Testing...
                </>
              ) : (
                "Test Database Connection"
              )}
            </Button>
            <Button onClick={handleReconnectDb} disabled={loading} variant="outline">
              Reconnect Database
            </Button>
          </div>
        </CardContent>
      </Card>

      {testResult && (
        <Card>
          <CardHeader>
            <CardTitle>Test Result</CardTitle>
          </CardHeader>
          <CardContent>
            {testResult.success ? (
              <Alert className="bg-green-50 border-green-200 text-green-800">
                <CheckCircle className="h-4 w-4" />
                <AlertTitle>Success!</AlertTitle>
                <AlertDescription>
                  <p>Database connection successful.</p>
                  {testResult.currentTime && <p>Current Database Time: {testResult.currentTime}</p>}
                  {testResult.message && <p>{testResult.message}</p>}
                </AlertDescription>
              </Alert>
            ) : (
              <Alert className="bg-red-50 border-red-200 text-red-800">
                <XCircle className="h-4 w-4" />
                <AlertTitle>Error!</AlertTitle>
                <AlertDescription>
                  <p>Database connection failed.</p>
                  <p>Error: {testResult.error}</p>
                  <p>Please check your database credentials and network configuration.</p>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Connection Debug Information</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            Retrieve detailed information about the current database connection.
          </p>
          <ConnectionDebugInfo />
        </CardContent>
      </Card>
    </div>
  )
}

function ConnectionDebugInfo() {
  const [debugInfo, setDebugInfo] = useState<any>(null)
  const [loadingDebug, setLoadingDebug] = useState(false)
  const [errorDebug, setErrorDebug] = useState<string | null>(null)

  const fetchDebugInfo = async () => {
    setLoadingDebug(true)
    setErrorDebug(null)
    try {
      const response = await fetch("/api/connection-debug")
      const data = await response.json()
      if (data.success) {
        setDebugInfo(data)
      } else {
        setErrorDebug(data.error || "Failed to fetch debug info.")
      }
    } catch (error: any) {
      setErrorDebug(error.message)
    } finally {
      setLoadingDebug(false)
    }
  }

  useEffect(() => {
    fetchDebugInfo()
  }, [])

  return (
    <div>
      <Button onClick={fetchDebugInfo} disabled={loadingDebug} size="sm" className="mb-4">
        {loadingDebug ? (
          <>
            <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Loading...
          </>
        ) : (
          "Get Debug Info"
        )}
      </Button>
      {errorDebug && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{errorDebug}</AlertDescription>
        </Alert>
      )}
      {debugInfo && debugInfo.success && (
        <div className="space-y-2 text-sm">
          <p>
            <strong>Database:</strong> {debugInfo.database}
          </p>
          <p>
            <strong>Server:</strong> {debugInfo.server}
          </p>
          <p>
            <strong>Client IP (as seen by DB):</strong> {debugInfo.clientIp}
          </p>
          <p>
            <strong>SQL Version:</strong> {debugInfo.sqlVersion}
          </p>
          {debugInfo.connectionDetails && (
            <>
              <p>
                <strong>Net Transport:</strong> {debugInfo.connectionDetails.net_transport}
              </p>
              <p>
                <strong>Encrypt Option:</strong> {debugInfo.connectionDetails.encrypt_option}
              </p>
            </>
          )}
        </div>
      )}
    </div>
  )
}
