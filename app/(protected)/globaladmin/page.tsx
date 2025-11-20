"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@refugehouse/shared-core/components/ui/card"
import { Users, Settings, Globe, Shield } from "lucide-react"
import Link from "next/link"

export default function GlobalAdminDashboard() {
  const router = useRouter()
  const [microserviceCode, setMicroserviceCode] = useState<string | null>(null)

  // Get microservice code from navigation API
  useEffect(() => {
    fetch('/api/navigation')
      .then(res => res.json())
      .then(data => {
        const code = data.metadata?.microservice?.code || 'home-visits'
        setMicroserviceCode(code)
        if (code !== 'service-domain-admin') {
          router.push('/dashboard')
        }
      })
      .catch(() => {
        // Fallback: check environment variable (only works if set as NEXT_PUBLIC)
        const envCode = process.env.NEXT_PUBLIC_MICROSERVICE_CODE || 'home-visits'
        setMicroserviceCode(envCode)
        if (envCode !== 'service-domain-admin') {
          router.push('/dashboard')
        }
      })
  }, [router])

  if (!microserviceCode || microserviceCode !== 'service-domain-admin') {
    return null
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Domain Administration</h1>
        <p className="text-muted-foreground mt-2">
          Manage users, microservices, and domain configuration across the platform
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Link href="/globaladmin/users">
          <Card className="hover:bg-accent transition-colors cursor-pointer h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                User Admin
              </CardTitle>
              <CardDescription>
                Manage users across all microservices, including roles and permissions
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/globaladmin/microservices">
          <Card className="hover:bg-accent transition-colors cursor-pointer h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Microservice Configuration
              </CardTitle>
              <CardDescription>
                Configure microservices, navigation items, and service settings
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/globaladmin/domains">
          <Card className="hover:bg-accent transition-colors cursor-pointer h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Domain Admin
              </CardTitle>
              <CardDescription>
                Manage domain-level settings and cross-microservice configuration
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            System Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Welcome to the Refuge House Microservice Domain Administration portal.
            Use the cards above to access different administration areas.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

