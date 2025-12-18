"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useUser } from "@clerk/nextjs"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@refugehouse/shared-core/components/ui/card"
import { AccountRegistrationRequired } from "@refugehouse/shared-core/components/account-registration-required"
import { useDatabaseAccess } from "@refugehouse/shared-core/hooks/use-database-access"
import { JobDescriptionBrowser } from "@/components/admin/job-description-browser"
import { AlertCircle, Briefcase } from "lucide-react"

export default function JobDescriptionsPage() {
  const router = useRouter()
  const { user, isLoaded } = useUser()
  const { hasAccess: hasDatabaseAccess, isLoading: checkingAccess } = useDatabaseAccess()
  const [microserviceCode, setMicroserviceCode] = useState<string | null>(null)
  const [githubConfig, setGithubConfig] = useState<{ owner: string; repo: string } | null>(null)

  // Get user headers for API calls (from Clerk user)
  const getUserHeaders = (): HeadersInit => {
    if (!user) {
      return {
        "Content-Type": "application/json",
      }
    }
    return {
      "Content-Type": "application/json",
      "x-user-email": user.emailAddresses[0]?.emailAddress || "",
      "x-user-clerk-id": user.id,
      "x-user-name": `${user.firstName || ""} ${user.lastName || ""}`.trim(),
    }
  }

  // Get microservice code from navigation API
  useEffect(() => {
    if (!isLoaded || !user || checkingAccess) {
      return
    }

    fetch('/api/navigation', {
      headers: getUserHeaders(),
      credentials: 'include',
    })
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
  }, [isLoaded, user, router, checkingAccess])

  // Load GitHub configuration from environment variables
  useEffect(() => {
    const owner = process.env.NEXT_PUBLIC_GITHUB_OWNER
    const repo = process.env.NEXT_PUBLIC_GITHUB_REPO
    
    if (owner && repo) {
      setGithubConfig({ owner, repo })
    }
  }, [])

  // Show loading state while checking access
  if (!isLoaded || checkingAccess) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded w-1/3"></div>
          <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/2"></div>
          <div className="h-96 bg-slate-200 dark:bg-slate-800 rounded"></div>
        </div>
      </div>
    )
  }

  // SECURITY: If no user, redirect to sign-in
  if (!user) {
    router.push('/sign-in')
    return null
  }

  // SECURITY: If user is authenticated but not found in database, show registration required
  if (!hasDatabaseAccess) {
    return (
      <AccountRegistrationRequired 
        microserviceName="Domain Administration"
        contactEmail="jduarte@refugehouse.org"
      />
    )
  }

  if (!microserviceCode || microserviceCode !== 'service-domain-admin') {
    return null
  }

  if (!githubConfig) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Briefcase className="w-8 h-8" />
            Job Descriptions
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage job descriptions in the knowledge base repository
          </p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Configuration Required
            </CardTitle>
            <CardDescription>
              GitHub repository configuration is missing
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Please ensure the following environment variables are set:
            </p>
            <ul className="list-disc list-inside mt-2 text-sm text-muted-foreground space-y-1">
              <li><code className="bg-muted px-1 py-0.5 rounded">NEXT_PUBLIC_GITHUB_OWNER</code></li>
              <li><code className="bg-muted px-1 py-0.5 rounded">NEXT_PUBLIC_GITHUB_REPO</code></li>
              <li><code className="bg-muted px-1 py-0.5 rounded">GITHUB_TOKEN</code> (server-side only)</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Briefcase className="w-8 h-8" />
          Job Descriptions
        </h1>
        <p className="text-muted-foreground mt-2">
          Create, view, and archive job descriptions from{" "}
          <code className="bg-muted px-1 py-0.5 rounded">{githubConfig.owner}/{githubConfig.repo}</code>
        </p>
      </div>
      <JobDescriptionBrowser owner={githubConfig.owner} repo={githubConfig.repo} />
    </div>
  )
}
