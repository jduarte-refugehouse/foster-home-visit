"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Terminal, RefreshCw, XCircle } from "lucide-react"

export default function IpManagementPage() {
  const [ipAddress, setIpAddress] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchCurrentIp = async () => {
    setLoading(true)
    setIpAddress(null)
    setError(null)
    try {
      const response = await fetch("/api/add-current-ip")
      const data = await response.json()
      if (data.success) {
        setIpAddress(data.ipAddress)
      } else {
        setError(data.error || "Failed to retrieve IP address.")
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-center mb-8">IP Management</h1>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Retrieve Current Client IP</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Click the button below to retrieve the current IP address from which your application is connecting to the
            database. This IP address needs to be whitelisted in your Azure SQL Database firewall rules if you are not
            using a static IP proxy.
          </p>
          <Button onClick={fetchCurrentIp} disabled={loading}>
            {loading ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Fetching IP...
              </>
            ) : (
              "Get Current Client IP"
            )}
          </Button>
          {ipAddress && (
            <Alert>
              <Terminal className="h-4 w-4" />
              <AlertTitle>Current Client IP Address</AlertTitle>
              <AlertDescription>
                <p className="font-mono text-lg">{ipAddress}</p>
                <p className="mt-2">
                  **Important:** Add this IP address to your Azure SQL Database firewall rules. If you are using a
                  static IP proxy like Fixie, you should whitelist the proxy's static IP addresses instead.
                </p>
              </AlertDescription>
            </Alert>
          )}
          {error && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Azure SQL Firewall Management</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            To allow your application to connect to Azure SQL Database, you must configure firewall rules.
          </p>
          <h3 className="font-semibold text-lg mb-2">Steps to Add IP to Azure SQL Firewall:</h3>
          <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
            <li>Go to the Azure portal and navigate to your SQL server.</li>
            <li>
              In the left-hand menu, under "Security", select "Networking" (or "Firewalls and virtual networks"
              depending on your Azure portal version).
            </li>
            <li>
              Add a new firewall rule with the IP address obtained above (or the static IP of your proxy service).
            </li>
            <li>
              Ensure "Allow Azure services and resources to access this server" is set to "Yes" if your application is
              hosted on Azure services (e.g., Azure App Service).
            </li>
          </ol>
          <p className="text-muted-foreground mt-4">
            For more details, refer to the{" "}
            <a
              href="https://docs.microsoft.com/en-us/azure/azure-sql/database/firewall-configure"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              Azure SQL Database firewall documentation
            </a>
            .
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
