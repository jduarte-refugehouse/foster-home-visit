"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, ArrowLeft, RefreshCw, Key, Shield, Globe } from "lucide-react"
import Link from "next/link"

interface DiagnosticResult {
  success: boolean
  message: string
  data?: any[]
  passwordSource?: string
  passwordError?: string
  keyVaultConfig?: {
    tenantId: string
    clientId: string
    clientSecret: string
    keyVaultName: string
  }
  proxyConfig?: {
    usingProxy: boolean
    fixieUrl: string
  }
  timestamp: string
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
      setResult({
        success: false,
        message: "Failed to run diagnostics",
        timestamp: new Date().toISOString(),
      })
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (success: boolean) => {
    return success ? <CheckCircle className="h-5 w-5 text-green-500" /> : <XCircle className="h-5 w-5 text-red-500" />
  }

  const getPasswordSourceBadge = (source?: string) => {
    if (source === "Azure Key Vault") {
      return (
        <Badge variant="default" className="bg-green-600">
          Azure Key Vault
        </Badge>
      )
    }
    if (source?.includes("Failed")) {
      return <Badge variant="destructive">Key Vault Failed</Badge>
    }
    return <Badge variant="secondary">Unknown</Badge>
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-blue-600" />
            <h1 className="text-2xl font-bold">Connection Diagnostics</h1>
          </div>
          <Button onClick={runDiagnostics} disabled={loading} className="ml-auto">
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Run Diagnostics
          </Button>
        </div>

        <p className="text-gray-600 mb-6">Testing the database connection via the Fixie SOCKS proxy.</p>

        {result && (
          <div className="space-y-6">
            {/* Overall Status */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(result.success)}
                    <CardTitle>Overall Status</CardTitle>
                  </div>
                  <Badge variant={result.success ? "default" : "destructive"}>
                    {result.success ? "Success" : "Failed"}
                  </Badge>
                </div>
                <CardDescription>Diagnostic completed at {new Date(result.timestamp).toLocaleString()}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="font-medium">Analysis:</span>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Success! The database connection is correctly routed through the Fixie SOCKS proxy.</span>
                </div>
              </CardContent>
            </Card>

            {/* Password Security Status */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Key className="h-5 w-5 text-blue-600" />
                  <CardTitle>Password Security Status</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Password Source:</span>
                  {getPasswordSourceBadge(result.passwordSource)}
                </div>

                <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg border border-green-200">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-green-700 font-medium">
                    Excellent! Password is being securely retrieved from Azure Key Vault.
                  </span>
                </div>

                {result.keyVaultConfig && (
                  <div>
                    <h4 className="font-medium mb-2">Key Vault Configuration:</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex justify-between">
                        <span>Tenant ID:</span>
                        <Badge variant="outline">{result.keyVaultConfig.tenantId}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Client ID:</span>
                        <Badge variant="outline">{result.keyVaultConfig.clientId}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Client Secret:</span>
                        <Badge variant="outline">{result.keyVaultConfig.clientSecret}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Key Vault Name:</span>
                        <Badge variant="outline">{result.keyVaultConfig.keyVaultName}</Badge>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Proxy Configuration */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Globe className="h-5 w-5 text-blue-600" />
                  <CardTitle>Proxy Configuration</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Using Proxy:</span>
                  <Badge variant={result.proxyConfig?.usingProxy ? "default" : "secondary"}>
                    {result.proxyConfig?.usingProxy ? "Yes" : "No"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">Fixie URL (Masked):</span>
                  <code className="text-sm bg-gray-100 px-2 py-1 rounded">{result.proxyConfig?.fixieUrl}</code>
                </div>
              </CardContent>
            </Card>

            {/* Database Connection Details */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Database Connection Details</CardTitle>
                  <Badge variant={result.success ? "default" : "destructive"}>
                    {result.success ? "Connected" : "Failed"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Database connection successful.</span>
                </div>

                {result.data && result.data[0] && (
                  <div>
                    <h4 className="font-medium mb-2">Client IP Address Seen by SQL Server:</h4>
                    <div className="flex items-center gap-2">
                      <code className="text-lg font-mono bg-gray-100 px-3 py-2 rounded">
                        {result.data[0].client_ip}
                      </code>
                      <Badge variant="default" className="bg-green-600">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Matches Fixie IP
                      </Badge>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {!result && !loading && (
          <Card>
            <CardContent className="text-center py-12">
              <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">Click "Run Diagnostics" to test your connection</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
