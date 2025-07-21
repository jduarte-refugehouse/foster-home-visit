"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Terminal, RefreshCw, CheckCircle, XCircle } from "lucide-react"

interface DiagnosticResult {
  dbConnectionStatus: string
  dbConnectionError: string
  proxyConnectionStatus: string
  proxyConnectionError: string
  proxyIp: string
  currentClientIp: string
  fixieSocksHost: string
  databaseUrl: string
  postgresUser: string
  postgresHost: string
  postgresDatabase: string
}

export default function DiagnosticsPage() {
  const [results, setResults] = useState<DiagnosticResult | null>(null)
  const [loading, setLoading] = useState(false)

  const runDiagnostics = async () => {
    setLoading(true)
    setResults(null)
    try {
      const response = await fetch("/api/diagnostics")
      const data = await response.json()
      setResults(data)
    } catch (error: any) {
      setResults({
        dbConnectionStatus: "Failed",
        dbConnectionError: error.message,
        proxyConnectionStatus: "Failed",
        proxyConnectionError: error.message,
        proxyIp: "N/A",
        currentClientIp: "N/A",
        fixieSocksHost: "N/A",
        databaseUrl: "N/A",
        postgresUser: "N/A",
        postgresHost: "N/A",
        postgresDatabase: "N/A",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    runDiagnostics()
  }, [])

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-center mb-8">Application Diagnostics</h1>

      <Card className="mb-8">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-2xl font-bold">Connection Status</CardTitle>
          <Button onClick={runDiagnostics} disabled={loading} size="sm">
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Run Diagnostics
          </Button>
        </CardHeader>
        <CardContent>
          {loading && <div className="text-center py-4">Running tests...</div>}
          {results && (
            <div className="space-y-4">
              <Alert variant={results.dbConnectionStatus.includes("Success") ? "default" : "destructive"}>
                {results.dbConnectionStatus.includes("Success") ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <XCircle className="h-4 w-4" />
                )}
                <AlertTitle>Database Connection: {results.dbConnectionStatus}</AlertTitle>
                {results.dbConnectionError && <AlertDescription>{results.dbConnectionError}</AlertDescription>}
              </Alert>

              <Alert variant={results.proxyConnectionStatus.includes("Success") ? "default" : "destructive"}>
                {results.proxyConnectionStatus.includes("Success") ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <XCircle className="h-4 w-4" />
                )}
                <AlertTitle>Proxy Connection: {results.proxyConnectionStatus}</AlertTitle>
                {results.proxyConnectionError && <AlertDescription>{results.proxyConnectionError}</AlertDescription>}
              </Alert>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Proxy Details</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm">
                    <p>
                      <strong>Proxy IP (External):</strong> {results.proxyIp}
                    </p>
                    <p>
                      <strong>Fixie SOCKS Host Env:</strong> {results.fixieSocksHost}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Database Config</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm">
                    <p>
                      <strong>Database URL Env:</strong> {results.databaseUrl}
                    </p>
                    <p>
                      <strong>Postgres User Env:</strong> {results.postgresUser}
                    </p>
                    <p>
                      <strong>Postgres Host Env:</strong> {results.postgresHost}
                    </p>
                    <p>
                      <strong>Postgres Database Env:</strong> {results.postgresDatabase}
                    </p>
                  </CardContent>
                </Card>
              </div>

              <Alert>
                <Terminal className="h-4 w-4" />
                <AlertTitle>Your Current Client IP</AlertTitle>
                <AlertDescription>
                  This is the IP address from which your browser is accessing this page.
                  <p className="font-mono mt-2">{results.currentClientIp}</p>
                </AlertDescription>
              </Alert>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Troubleshooting Tips</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground">
            <li>
              **Database Connection Failed:**
              <ul>
                <li>
                  Double-check your `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_HOST`, and `POSTGRES_DATABASE`
                  environment variables.
                </li>
                <li>Ensure your Azure SQL Database firewall allows connections from the Fixie proxy IP addresses.</li>
                <li>Verify network connectivity from your deployment region to Azure SQL.</li>
              </ul>
            </li>
            <li>
              **Proxy Connection Failed:**
              <ul>
                <li>
                  Ensure `FIXIE_SOCKS_HOST` is correctly set and formatted (e.g., `socks://user:password@host:port`).
                </li>
                <li>Verify your Fixie API key is correct and active.</li>
                <li>Check Fixie's status page for any service outages.</li>
              </ul>
            </li>
            <li>
              **Deployment Errors (`ERR_PNPM_OUTDATED_LOCKFILE`):**
              <ul>
                <li>Run `pnpm install` locally to update `pnpm-lock.yaml`.</li>
                <li>Commit both `package.json` and `pnpm-lock.yaml` to your Git repository.</li>
                <li>Redeploy your application.</li>
              </ul>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
