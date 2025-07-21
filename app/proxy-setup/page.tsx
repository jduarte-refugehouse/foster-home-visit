"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CheckCircle, XCircle, RefreshCw } from "lucide-react"

export default function ProxySetupPage() {
  const [fixieUrl, setFixieUrl] = useState(process.env.NEXT_PUBLIC_FIXIE_SOCKS_HOST || "")
  const [testResult, setTestResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const handleTestProxy = async () => {
    setLoading(true)
    setTestResult(null)
    try {
      const response = await fetch("/api/proxy-test")
      const data = await response.json()
      setTestResult(data)
    } catch (error: any) {
      setTestResult({ success: false, error: error.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-center mb-8">Proxy Setup & Test</h1>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Fixie SOCKS Proxy Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            To connect to your Azure SQL Database via a static IP, you need to configure a SOCKS proxy. We recommend
            using Fixie.
          </p>
          <div className="space-y-4">
            <div>
              <Label htmlFor="fixie-url">FIXIE_SOCKS_HOST Environment Variable</Label>
              <Input
                id="fixie-url"
                type="text"
                value={fixieUrl}
                onChange={(e) => setFixieUrl(e.target.value)}
                placeholder="e.g., socks://user:password@host:port"
                className="mt-1"
                readOnly // This value should come from environment variables, not user input directly
              />
              <p className="text-sm text-muted-foreground mt-1">
                This value should be set as an environment variable on Vercel and in your local `.env.local` file.
              </p>
            </div>
            <Button onClick={handleTestProxy} disabled={loading}>
              {loading ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Testing...
                </>
              ) : (
                "Test Proxy Connection"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {testResult && (
        <Card>
          <CardHeader>
            <CardTitle>Proxy Test Result</CardTitle>
          </CardHeader>
          <CardContent>
            {testResult.success ? (
              <Alert className="bg-green-50 border-green-200 text-green-800">
                <CheckCircle className="h-4 w-4" />
                <AlertTitle>Success!</AlertTitle>
                <AlertDescription>
                  <p>Proxy connection established successfully.</p>
                  <p>Your external IP via proxy: {testResult.proxyIp}</p>
                  <p>{testResult.message}</p>
                </AlertDescription>
              </Alert>
            ) : (
              <Alert className="bg-red-50 border-red-200 text-red-800">
                <XCircle className="h-4 w-4" />
                <AlertTitle>Error!</AlertTitle>
                <AlertDescription>
                  <p>Failed to connect via proxy.</p>
                  <p>Error: {testResult.error}</p>
                  <p>Please ensure your `FIXIE_SOCKS_HOST` environment variable is correctly configured.</p>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Important Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground">
            <li>
              The `FIXIE_SOCKS_HOST` environment variable should be in the format:
              `socks://username:password@host:port`.
            </li>
            <li>
              Ensure the IP address provided by Fixie (or your proxy service) is whitelisted in your Azure SQL Database
              firewall rules.
            </li>
            <li>
              For local development, set `FIXIE_SOCKS_HOST` in your `.env.local` file. For Vercel deployments, set it in
              your project's environment variables.
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
