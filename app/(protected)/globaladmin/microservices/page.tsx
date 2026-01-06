"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@refugehouse/shared-core/components/ui/card"
import { Settings } from "lucide-react"

export default function MicroserviceConfigPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Microservice Configuration</h1>
        <p className="text-muted-foreground mt-2">
          Configure microservices and their settings
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Microservice Management
          </CardTitle>
          <CardDescription>
            Manage microservice registration, navigation, and configuration
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Microservice configuration interface coming soon. This will allow you to:
          </p>
          <ul className="list-disc list-inside mt-2 text-sm text-muted-foreground space-y-1">
            <li>View all registered microservices</li>
            <li>Register new microservices</li>
            <li>Configure navigation items per microservice</li>
            <li>Manage microservice-specific settings</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}

