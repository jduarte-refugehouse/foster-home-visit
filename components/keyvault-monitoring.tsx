"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Key, Shield, RefreshCw, Trash2 } from "lucide-react"

interface KeyVaultStatus {
  status: string
  keyVault: {
    connected: boolean
    secretsCount: number
    secrets: Array<{ name: string; hasValue: boolean }>
  }
  cache: {
    size: number
  }
  timestamp: string
}

export function KeyVaultMonitoring() {
  const [status, setStatus] = useState<KeyVaultStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const checkStatus = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/admin/keyvault")
      const data = await response.json()
      setStatus(data)
    } catch (error) {
      console.error("Failed to check Key Vault status:", error)
    } finally {
      setLoading(false)
    }
  }

  const performAction = async (action: string) => {
    setActionLoading(action)
    try {
      const response = await fetch("/api/admin/keyvault", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      })
      const result = await response.json()
      console.log(result.message)
      await checkStatus() // Refresh status
    } catch (error) {
      console.error(`Failed to perform action ${action}:`, error)
    } finally {
      setActionLoading(null)
    }
  }

  useEffect(() => {
    checkStatus()
    // Check status every 10 minutes
    const interval = setInterval(checkStatus, 10 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Shield className="w-5 h-5" />
            <CardTitle>Azure Key Vault</CardTitle>
          </div>
          <Button variant="ghost" size="sm" onClick={checkStatus} disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
        <CardDescription>Secure configuration and secrets management</CardDescription>
      </CardHeader>
      <CardContent>
        {status ? (
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Badge variant={status.keyVault.connected ? "default" : "destructive"}>
                {status.keyVault.connected ? "Connected" : "Disconnected"}
              </Badge>
              <span className="text-sm text-gray-600">{status.keyVault.secretsCount} secrets configured</span>
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-medium flex items-center">
                <Key className="w-4 h-4 mr-1" />
                Configured Secrets
              </h4>
              <div className="grid grid-cols-1 gap-1">
                {status.keyVault.secrets.slice(0, 5).map((secret) => (
                  <div key={secret.name} className="text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded">
                    {secret.name}
                  </div>
                ))}
                {status.keyVault.secrets.length > 5 && (
                  <div className="text-xs text-gray-500">+{status.keyVault.secrets.length - 5} more secrets</div>
                )}
              </div>
            </div>

            <div className="flex space-x-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => performAction("test-connection")}
                disabled={actionLoading === "test-connection"}
              >
                Test Connection
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => performAction("clear-cache")}
                disabled={actionLoading === "clear-cache"}
              >
                <Trash2 className="w-3 h-3 mr-1" />
                Clear Cache
              </Button>
            </div>

            <div className="text-xs text-gray-500">
              Cache size: {status.cache.size} | Last checked: {new Date(status.timestamp).toLocaleString()}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
