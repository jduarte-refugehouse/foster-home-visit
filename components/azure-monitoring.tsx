"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Database, Activity, RefreshCw } from "lucide-react"

interface DatabaseHealth {
  status: "healthy" | "unhealthy"
  message: string
  metrics?: any[]
  timestamp: string
}

export function AzureMonitoring() {
  const [health, setHealth] = useState<DatabaseHealth | null>(null)
  const [loading, setLoading] = useState(true)

  const checkHealth = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/health/database")
      const data = await response.json()
      setHealth(data)
    } catch (error) {
      console.error("Failed to check database health:", error)
      setHealth({
        status: "unhealthy",
        message: "Failed to connect to health endpoint",
        timestamp: new Date().toISOString(),
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    checkHealth()
    // Check health every 5 minutes
    const interval = setInterval(checkHealth, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Database className="w-5 h-5" />
            <CardTitle>Azure SQL Status</CardTitle>
          </div>
          <Button variant="ghost" size="sm" onClick={checkHealth} disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
        <CardDescription>Database connection and performance metrics</CardDescription>
      </CardHeader>
      <CardContent>
        {health ? (
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Badge variant={health.status === "healthy" ? "default" : "destructive"}>
                {health.status === "healthy" ? "Healthy" : "Unhealthy"}
              </Badge>
              <span className="text-sm text-gray-600">{health.message}</span>
            </div>

            {health.metrics && health.metrics.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium flex items-center">
                  <Activity className="w-4 h-4 mr-1" />
                  Database Metrics
                </h4>
                <div className="space-y-1">
                  {health.metrics.slice(0, 3).map((metric: any, index: number) => (
                    <div key={index} className="text-xs text-gray-600">
                      {metric.displayName}: {metric.currentValue} {metric.unit}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="text-xs text-gray-500">Last checked: {new Date(health.timestamp).toLocaleString()}</div>
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
