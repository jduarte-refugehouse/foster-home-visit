"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, RefreshCw, Settings, CheckCircle, XCircle, Key, AlertTriangle } from "lucide-react"
import Link from "next/link"

interface DiagnosticResult {
  success: boolean
  timestamp: string
  usingProxy: boolean
  fixieUrlMasked: string
  dbConnectionTest: {
    success: boolean
    message: string
    data?: Array<{
      login_name: string
      db_name: string
      client_ip: string
    }>
  }
  analysis: string
  passwordSource?: string
  passwordError?: string
  keyVaultConfig?: {
    tenantId: string
    clientId: string
    clientSecret: string
    keyVaultName: string
  }
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
      console.error("Failed to run diagnostics:", error)
    } finally {
      setLoading(false)
    }
  }

  const isUsingKeyVault = result?.passwordSource === "Azure Key Vault"
  const isUsingFallback = result?.passwordSource === "Fallback (hardcoded)"

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Link>
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">Connection Diagnostics</h1>
            </div>
          </div>
          <Button onClick={runDiagnostics} disabled={loading} className="flex items-center gap-2">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Run Diagnostics
          </Button>
        </div>

        <p className="text-gray-600 mb-8">Testing the database connection via the Fixie SOCKS proxy.</p>

        {result && (
          <>
            {/* Overall Status */}
            <Card className="mb-6">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {result.success ? (
                      <CheckCircle className="h-6 w-6 text-green-600" />
                    ) : (
                      <XCircle className="h-6 w-6 text-red-600" />
                    )}
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">Overall Status</h2>
                      <p className="text-sm text-gray-500">
                        Diagnostic completed at {new Date(result.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <Badge variant={result.success ? "default" : "destructive"} className="text-sm">
                    {result.success ? "Success" : "Failed"}
                  </Badge>
                </div>

                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-gray-900">Analysis:</p>
                      <p className="text-gray-700">{result.analysis}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Password Source Status */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  Password Security Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Password Source:</span>
                    <div className="flex items-center gap-2">
                      {isUsingKeyVault ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-yellow-600" />
                      )}
                      <Badge variant={isUsingKeyVault ? "default" : "secondary"}>
                        {result.passwordSource || "Unknown"}
                      </Badge>
                    </div>
                  </div>

                  {isUsingKeyVault && (
                    <Alert>
                      <CheckCircle className="h-4 w-4" />
                      <AlertDescription>
                        ✅ Excellent! Password is being securely retrieved from Azure Key Vault.
                      </AlertDescription>
                    </Alert>
                  )}

                  {isUsingFallback && (
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        ⚠️ Warning: Using fallback hardcoded password. Key Vault retrieval failed.
                        {result.passwordError && (
                          <div className="mt-2">
                            <strong>Error:</strong> {result.passwordError}
                          </div>
                        )}
                      </AlertDescription>
                    </Alert>
                  )}

                  {result.keyVaultConfig && (
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-2">Key Vault Configuration:</h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          Tenant ID: <Badge variant="outline">{result.keyVaultConfig.tenantId}</Badge>
                        </div>
                        <div>
                          Client ID: <Badge variant="outline">{result.keyVaultConfig.clientId}</Badge>
                        </div>
                        <div>
                          Client Secret: <Badge variant="outline">{result.keyVaultConfig.clientSecret}</Badge>
                        </div>
                        <div>
                          Key Vault Name: <Badge variant="outline">{result.keyVaultConfig.keyVaultName}</Badge>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Proxy Configuration */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Proxy Configuration
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Using Proxy:</span>
                    <Badge variant={result.usingProxy ? "default" : "secondary"}>
                      {result.usingProxy ? "Yes" : "No"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Fixie URL (Masked):</span>
                    <code className="text-sm bg-gray-100 px-2 py-1 rounded">{result.fixieUrlMasked}</code>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Database Connection Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Database Connection Details</span>
                  <Badge variant={result.dbConnectionTest.success ? "default" : "destructive"}>
                    {result.dbConnectionTest.success ? "Connected" : "Failed"}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <p className="text-gray-700">{result.dbConnectionTest.message}</p>
                  </div>

                  {result.dbConnectionTest.data && result.dbConnectionTest.data.length > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Client IP Address Seen by SQL Server:</h4>
                      <div className="flex items-center gap-2">
                        <code className="text-lg font-mono bg-gray-100 px-3 py-2 rounded">
                          {result.dbConnectionTest.data[0].client_ip}
                        </code>
                        <Badge variant="default" className="text-xs">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Matches Fixie IP
                        </Badge>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {!result && !loading && (
          <Card>
            <CardContent className="p-12 text-center">
              <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Ready to Run Diagnostics</h3>
              <p className="text-gray-600 mb-4">Click the "Run Diagnostics" button to test your database connection.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
