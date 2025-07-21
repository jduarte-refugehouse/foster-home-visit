"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"
import { Loader2, CheckCircle, XCircle, RefreshCw } from "lucide-react"
import Link from "next/link"

interface DiagnosticsResult {
  success: boolean
  message?: string
  databaseConnection?: {
    success: boolean
    message: string
    data?: any[]
  }
  databaseHealth?: {
    success: boolean
    message: string
  }
  proxyConfiguration?: string
  environmentVariables?: {
    FIXIE_SOCKS_HOST: string
    QUOTAGUARD_URL: string
    POSTGRES_HOST: string
    POSTGRES_USER: string
    POSTGRES_DATABASE: string
  }
}

export default function DiagnosticsPage() {
  const [diagnostics, setDiagnostics] = useState<DiagnosticsResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchDiagnostics = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch("/api/diagnostics")
      const data: DiagnosticsResult = await response.json()
      setDiagnostics(data)
      if (!data.success) {
        setError(data.message || "Failed to run diagnostics.")
      }
    } catch (err) {
      console.error("Error fetching diagnostics:", err)
      setError((err as any).message || "An unexpected error occurred.")
    } finally {
      setLoading(false)
    }
  }

  const handleForceReconnect = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch("/api/reconnect")
      const data = await response.json()
      if (data.success) {
        alert("Database connection forcefully reconnected. Running diagnostics again...")
        await fetchDiagnostics() // Re-run diagnostics after reconnect
      } else {
        setError(data.message || "Failed to forcefully reconnect.")
      }
    } catch (err) {
      console.error("Error fetching diagnostics:", err)
      setError((err as any).message || "An unexpected error occurred.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDiagnostics()
  }, [])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-4xl shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-gray-900 dark:text-gray-50">Application Diagnostics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 text-gray-700 dark:text-gray-300">
          <p className="text-lg">
            This page provides a comprehensive overview of the application's connectivity and configuration status,
            helping you diagnose potential issues with the database or proxy.
          </p>

          {loading && (
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
              <p className="mt-4 text-xl font-medium">Running diagnostics...</p>
            </div>
          )}

          {error && (
            <div
              className="bg-red-100 dark:bg-red-900 border border-red-400 text-red-700 dark:text-red-300 px-4 py-3 rounded relative"
              role="alert"
            >
              <strong className="font-bold">Error:</strong>
              <span className="block sm:inline"> {error}</span>
            </div>
          )}

          {diagnostics && !loading && (
            <div className="space-y-6">
              <section>
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-50 mb-3">
                  Database Connection Status
                </h2>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    {diagnostics.databaseConnection?.success ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500" />
                    )}
                    <p className="font-medium">Connection Test:</p>
                    <p>{diagnostics.databaseConnection?.message}</p>
                  </div>
                  {diagnostics.databaseConnection?.data && diagnostics.databaseConnection.data.length > 0 && (
                    <div className="ml-7 text-sm">
                      <p>Login Name: {diagnostics.databaseConnection.data[0].login_name}</p>
                      <p>Database Name: {diagnostics.databaseConnection.data[0].db_name}</p>
                      <p>Client IP: {diagnostics.databaseConnection.data[0].client_ip}</p>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    {diagnostics.databaseHealth?.success ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500" />
                    )}
                    <p className="font-medium">Health Check:</p>
                    <p>{diagnostics.databaseHealth?.message}</p>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-50 mb-3">Proxy Configuration</h2>
                <div className="flex items-center gap-2">
                  {diagnostics.proxyConfiguration?.includes("Configured") ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500" />
                  )}
                  <p className="font-medium">Status:</p>
                  <p>{diagnostics.proxyConfiguration}</p>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-50 mb-3">Environment Variables</h2>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>
                    <span className="font-medium">FIXIE_SOCKS_HOST:</span>{" "}
                    {diagnostics.environmentVariables?.FIXIE_SOCKS_HOST}
                  </li>
                  <li>
                    <span className="font-medium">QUOTAGUARD_URL:</span>{" "}
                    {diagnostics.environmentVariables?.QUOTAGUARD_URL}
                  </li>
                  <li>
                    <span className="font-medium">POSTGRES_HOST:</span>{" "}
                    {diagnostics.environmentVariables?.POSTGRES_HOST}
                  </li>
                  <li>
                    <span className="font-medium">POSTGRES_USER:</span>{" "}
                    {diagnostics.environmentVariables?.POSTGRES_USER}
                  </li>
                  <li>
                    <span className="font-medium">POSTGRES_DATABASE:</span>{" "}
                    {diagnostics.environmentVariables?.POSTGRES_DATABASE}
                  </li>
                </ul>
              </section>
            </div>
          )}

          <div className="flex flex-col sm:flex-row justify-center gap-4 mt-8">
            <Button onClick={fetchDiagnostics} disabled={loading} className="w-full sm:w-auto">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Diagnostics
            </Button>
            <Button
              onClick={handleForceReconnect}
              disabled={loading}
              className="w-full sm:w-auto bg-transparent"
              variant="outline"
            >
              Force Reconnect DB
            </Button>
            <Link href="/proxy-setup">
              <Button className="w-full sm:w-auto" variant="secondary">
                Proxy Setup Guide
              </Button>
            </Link>
            <Link href="/">
              <Button className="w-full sm:w-auto" variant="default">
                Back to Home
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
