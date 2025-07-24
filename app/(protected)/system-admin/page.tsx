"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Settings, Database, Shield, Server, RefreshCw } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface SystemConfig {
  database: {
    status: "connected" | "disconnected" | "error"
    connectionCount: number
    lastBackup: string
  }
  authentication: {
    provider: string
    activeUsers: number
    sessionTimeout: number
  }
  microservices: {
    registered: number
    active: number
    lastSync: string
  }
  permissions: {
    totalRoles: number
    totalPermissions: number
    lastUpdated: string
  }
}

export default function SystemAdminPage() {
  const [systemConfig, setSystemConfig] = useState<SystemConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchSystemConfig()
  }, [])

  const fetchSystemConfig = async () => {
    setRefreshing(true)
    try {
      // Mock data - replace with actual API call
      const mockConfig: SystemConfig = {
        database: {
          status: "connected",
          connectionCount: 15,
          lastBackup: new Date().toISOString(),
        },
        authentication: {
          provider: "Clerk",
          activeUsers: 23,
          sessionTimeout: 3600,
        },
        microservices: {
          registered: 3,
          active: 3,
          lastSync: new Date().toISOString(),
        },
        permissions: {
          totalRoles: 8,
          totalPermissions: 15,
          lastUpdated: new Date().toISOString(),
        },
      }
      setSystemConfig(mockConfig)
    } catch (error) {
      console.error("Error fetching system config:", error)
      toast({
        title: "Error",
        description: "Failed to fetch system configuration",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleSystemAction = async (action: string) => {
    try {
      // Mock API call - replace with actual implementation
      await new Promise((resolve) => setTimeout(resolve, 1000))

      toast({
        title: "Success",
        description: `${action} completed successfully`,
      })

      fetchSystemConfig()
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to ${action}`,
        variant: "destructive",
      })
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "connected":
        return <Badge className="bg-green-100 text-green-800">Connected</Badge>
      case "disconnected":
        return <Badge className="bg-yellow-100 text-yellow-800">Disconnected</Badge>
      case "error":
        return <Badge className="bg-red-100 text-red-800">Error</Badge>
      default:
        return <Badge variant="secondary">Unknown</Badge>
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="h-12 bg-gray-200 rounded mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-48 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">System Administration</h1>
          <p className="text-muted-foreground">Manage system configuration and monitoring</p>
        </div>
        <Button onClick={fetchSystemConfig} disabled={refreshing}>
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
          {refreshing ? "Refreshing..." : "Refresh"}
        </Button>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="database">Database</TabsTrigger>
          <TabsTrigger value="authentication">Authentication</TabsTrigger>
          <TabsTrigger value="microservices">Microservices</TabsTrigger>
          <TabsTrigger value="permissions">Permissions</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Database</CardTitle>
                <Database className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{systemConfig?.database.connectionCount}</div>
                <p className="text-xs text-muted-foreground">Active connections</p>
                <div className="mt-2">{getStatusBadge(systemConfig?.database.status || "unknown")}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Users</CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{systemConfig?.authentication.activeUsers}</div>
                <p className="text-xs text-muted-foreground">Active users</p>
                <div className="mt-2">
                  <Badge variant="outline">{systemConfig?.authentication.provider}</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Microservices</CardTitle>
                <Server className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {systemConfig?.microservices.active}/{systemConfig?.microservices.registered}
                </div>
                <p className="text-xs text-muted-foreground">Active/Registered</p>
                <div className="mt-2">
                  <Badge className="bg-green-100 text-green-800">All Active</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Permissions</CardTitle>
                <Settings className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{systemConfig?.permissions.totalRoles}</div>
                <p className="text-xs text-muted-foreground">Total roles</p>
                <div className="mt-2">
                  <Badge variant="outline">{systemConfig?.permissions.totalPermissions} permissions</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="database" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Database Management
              </CardTitle>
              <CardDescription>Monitor and manage database connections and backups</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium">Connection Status</label>
                  <div className="mt-1">{getStatusBadge(systemConfig?.database.status || "unknown")}</div>
                </div>
                <div>
                  <label className="text-sm font-medium">Active Connections</label>
                  <div className="text-2xl font-bold">{systemConfig?.database.connectionCount}</div>
                </div>
                <div>
                  <label className="text-sm font-medium">Last Backup</label>
                  <div className="text-sm">
                    {systemConfig?.database.lastBackup
                      ? new Date(systemConfig.database.lastBackup).toLocaleString()
                      : "Never"}
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => handleSystemAction("backup database")}>Create Backup</Button>
                <Button variant="outline" onClick={() => handleSystemAction("test connection")}>
                  Test Connection
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="authentication" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Authentication Settings
              </CardTitle>
              <CardDescription>Manage authentication provider and user sessions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium">Provider</label>
                  <div className="mt-1">
                    <Badge variant="outline">{systemConfig?.authentication.provider}</Badge>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Active Users</label>
                  <div className="text-2xl font-bold">{systemConfig?.authentication.activeUsers}</div>
                </div>
                <div>
                  <label className="text-sm font-medium">Session Timeout</label>
                  <div className="text-sm">{systemConfig?.authentication.sessionTimeout}s</div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => handleSystemAction("sync users")}>Sync Users</Button>
                <Button variant="outline" onClick={() => handleSystemAction("clear sessions")}>
                  Clear All Sessions
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="microservices" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="h-5 w-5" />
                Microservices Management
              </CardTitle>
              <CardDescription>Monitor and manage registered microservices</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium">Registered</label>
                  <div className="text-2xl font-bold">{systemConfig?.microservices.registered}</div>
                </div>
                <div>
                  <label className="text-sm font-medium">Active</label>
                  <div className="text-2xl font-bold">{systemConfig?.microservices.active}</div>
                </div>
                <div>
                  <label className="text-sm font-medium">Last Sync</label>
                  <div className="text-sm">
                    {systemConfig?.microservices.lastSync
                      ? new Date(systemConfig.microservices.lastSync).toLocaleString()
                      : "Never"}
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => handleSystemAction("sync microservices")}>Sync All</Button>
                <Button variant="outline" onClick={() => handleSystemAction("refresh registry")}>
                  Refresh Registry
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="permissions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Permissions Management
              </CardTitle>
              <CardDescription>Manage system roles and permissions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium">Total Roles</label>
                  <div className="text-2xl font-bold">{systemConfig?.permissions.totalRoles}</div>
                </div>
                <div>
                  <label className="text-sm font-medium">Total Permissions</label>
                  <div className="text-2xl font-bold">{systemConfig?.permissions.totalPermissions}</div>
                </div>
                <div>
                  <label className="text-sm font-medium">Last Updated</label>
                  <div className="text-sm">
                    {systemConfig?.permissions.lastUpdated
                      ? new Date(systemConfig.permissions.lastUpdated).toLocaleString()
                      : "Never"}
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => handleSystemAction("refresh permissions")}>Refresh Permissions</Button>
                <Button variant="outline" onClick={() => handleSystemAction("audit permissions")}>
                  Audit Permissions
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
