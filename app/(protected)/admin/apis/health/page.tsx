"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@refugehouse/shared-core/components/ui/card"
import { Badge } from "@refugehouse/shared-core/components/ui/badge"
import { Button } from "@refugehouse/shared-core/components/ui/button"
import { Alert, AlertDescription } from "@refugehouse/shared-core/components/ui/alert"
import {
  Activity,
  CheckCircle,
  XCircle,
  RefreshCw,
  Server,
  Key,
  TrendingUp,
  Clock,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface HealthData {
  health: {
    overall: string
    timestamp: string
  }
  statistics: {
    totalKeys: number
    activeKeys: number
    expiredKeys: number
    totalRequests: number
    keysByMicroservice: Array<{
      microservice_code: string
      total_keys: number
      total_requests: number
      last_activity: string | null
      avg_rate_limit: number
    }>
  }
  endpoints: Record<
    string,
    {
      status: string
      lastChecked: string
    }
  >
}

export default function ApiHealthPage() {
  const [healthData, setHealthData] = useState<HealthData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchHealth()
  }, [])

  const fetchHealth = async () => {
    try {
      setRefreshing(true)
      const response = await fetch("/api/admin/api-health")
      if (response.ok) {
        const data = await response.json()
        setHealthData(data)
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch health data",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error fetching health data:", error)
      toast({
        title: "Error",
        description: "Failed to fetch health data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (!healthData) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>Failed to load health data</AlertDescription>
        </Alert>
      </div>
    )
  }

  const { health, statistics, endpoints } = healthData

  return (
    <div className="container mx-auto p-6 space-y-6 max-w-7xl">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">API Health Monitoring</h1>
          <p className="text-muted-foreground">
            Monitor the health and performance of the Radius API Hub
          </p>
        </div>
        <Button onClick={fetchHealth} disabled={refreshing}>
          <RefreshCw
            className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      {/* Overall Health Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Overall Health Status</CardTitle>
              <CardDescription>
                Last updated: {new Date(health.timestamp).toLocaleString()}
              </CardDescription>
            </div>
            <Badge
              variant={health.overall === "healthy" ? "default" : "destructive"}
              className="text-lg px-4 py-2"
            >
              {health.overall === "healthy" ? (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Healthy
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4 mr-2" />
                  Unhealthy
                </>
              )}
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total API Keys
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Key className="h-4 w-4 text-muted-foreground" />
              <div className="text-2xl font-bold">{statistics.totalKeys}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Keys
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-green-600" />
              <div className="text-2xl font-bold">{statistics.activeKeys}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Requests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              <div className="text-2xl font-bold">
                {statistics.totalRequests.toLocaleString()}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Expired Keys
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-600" />
              <div className="text-2xl font-bold">{statistics.expiredKeys}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Endpoint Health */}
      <Card>
        <CardHeader>
          <CardTitle>Endpoint Health</CardTitle>
          <CardDescription>Status of individual API endpoints</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(endpoints).map(([path, status]) => (
              <div
                key={path}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <Server className="h-4 w-4 text-muted-foreground" />
                  <code className="text-sm font-mono">{path}</code>
                </div>
                <div className="flex items-center gap-3">
                  <Badge
                    variant={status.status === "healthy" ? "default" : "destructive"}
                  >
                    {status.status === "healthy" ? (
                      <>
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Healthy
                      </>
                    ) : (
                      <>
                        <XCircle className="h-3 w-3 mr-1" />
                        Unhealthy
                      </>
                    )}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {new Date(status.lastChecked).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Usage by Microservice */}
      {statistics.keysByMicroservice && statistics.keysByMicroservice.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Usage by Microservice</CardTitle>
            <CardDescription>
              API key usage statistics grouped by microservice
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {statistics.keysByMicroservice.map((ms) => (
                <div
                  key={ms.microservice_code}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div>
                    <div className="font-medium">{ms.microservice_code}</div>
                    <div className="text-sm text-muted-foreground">
                      {ms.total_keys} key{ms.total_keys !== 1 ? "s" : ""} •{" "}
                      {ms.total_requests.toLocaleString()} requests
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">
                      {ms.avg_rate_limit.toFixed(0)}/min avg
                    </div>
                    {ms.last_activity && (
                      <div className="text-xs text-muted-foreground">
                        Last: {new Date(ms.last_activity).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

