"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Database, Activity, AlertCircle, CheckCircle, RefreshCw } from "lucide-react"

export const dynamic = "force-dynamic"

export default function DiagnosticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">System Diagnostics</h1>
        <p className="text-muted-foreground">Monitor system health and performance</p>
      </div>

      {/* System Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Database Status</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">Connected</div>
            <p className="text-xs text-muted-foreground">Azure SQL Database</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Health</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">Healthy</div>
            <p className="text-xs text-muted-foreground">All systems operational</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Check</CardTitle>
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2 min ago</div>
            <p className="text-xs text-muted-foreground">Automatic monitoring</p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Diagnostics */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>System Components</CardTitle>
              <CardDescription>Detailed status of all system components</CardDescription>
            </div>
            <Button variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Run Tests
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <div>
                  <h3 className="font-medium">Database Connection</h3>
                  <p className="text-sm text-muted-foreground">Azure SQL Server connection active</p>
                </div>
              </div>
              <Badge variant="default">Healthy</Badge>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <div>
                  <h3 className="font-medium">Authentication Service</h3>
                  <p className="text-sm text-muted-foreground">Authentication service operational</p>
                </div>
              </div>
              <Badge variant="default">Healthy</Badge>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <div>
                  <h3 className="font-medium">Proxy Connection</h3>
                  <p className="text-sm text-muted-foreground">Fixie SOCKS proxy connection stable</p>
                </div>
              </div>
              <Badge variant="default">Connected</Badge>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center space-x-3">
                <AlertCircle className="w-5 h-5 text-orange-500" />
                <div>
                  <h3 className="font-medium">Cache Service</h3>
                  <p className="text-sm text-muted-foreground">Redis cache experiencing minor delays</p>
                </div>
              </div>
              <Badge variant="secondary">Warning</Badge>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <div>
                  <h3 className="font-medium">File Storage</h3>
                  <p className="text-sm text-muted-foreground">Document storage service operational</p>
                </div>
              </div>
              <Badge variant="default">Healthy</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
