"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, XCircle } from "lucide-react"

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
  const fixieStaticIPs = ["3.2", "5.6", "7.8"] // Added missing static IPs and corrected syntax

  // Additional code can be added here if needed
}
