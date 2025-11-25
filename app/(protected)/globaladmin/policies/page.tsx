"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useUser } from "@clerk/nextjs"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@refugehouse/shared-core/components/ui/card"
import { AccountRegistrationRequired } from "@refugehouse/shared-core/components/account-registration-required"
import { useDatabaseAccess } from "@refugehouse/shared-core/hooks/use-database-access"
import { FolderGit, Search, Shield, FileText, BookOpen, CheckCircle } from "lucide-react"
import Link from "next/link"

export default function PoliciesPage() {
  const router = useRouter()
  const { user, isLoaded } = useUser()
  const { hasAccess: hasDatabaseAccess, isLoading: checkingAccess } = useDatabaseAccess()
  const [microserviceCode, setMicroserviceCode] = useState<string | null>(null)

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

  // Show loading state while checking access
  if (!isLoaded || checkingAccess) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded w-1/3"></div>
          <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/2"></div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-slate-200 dark:bg-slate-800 rounded"></div>
            ))}
          </div>
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

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Policy Management</h1>
        <p className="text-muted-foreground mt-2">
          Manage policies, procedures, and regulatory documentation for Refuge House
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Link href="/globaladmin/policies/repository">
          <Card className="hover:bg-accent transition-colors cursor-pointer h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FolderGit className="h-5 w-5" />
                Repository Browser
              </CardTitle>
              <CardDescription>
                Browse and view files from the policies and procedures repository
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/globaladmin/policies/search">
          <Card className="hover:bg-accent transition-colors cursor-pointer h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Policy Search
              </CardTitle>
              <CardDescription>
                Search policies, procedures, and regulatory documents by keyword or topic
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/globaladmin/policies/compliance">
          <Card className="hover:bg-accent transition-colors cursor-pointer h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Compliance Checking
              </CardTitle>
              <CardDescription>
                Verify feature implementations against policy requirements and regulatory standards
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/globaladmin/policies/documents">
          <Card className="hover:bg-accent transition-colors cursor-pointer h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Document Management
              </CardTitle>
              <CardDescription>
                Manage policy documents, track revisions, and view document history
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/globaladmin/policies/references">
          <Card className="hover:bg-accent transition-colors cursor-pointer h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Regulatory References
              </CardTitle>
              <CardDescription>
                Access T3C Blueprint, TAC Chapter 749, and RCC Contract documentation
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/globaladmin/policies/validation">
          <Card className="hover:bg-accent transition-colors cursor-pointer h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Policy Validation
              </CardTitle>
              <CardDescription>
                Validate policy documents for completeness and regulatory alignment
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Policy Management Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            The Policy Management section provides comprehensive tools for managing Refuge House policies, 
            procedures, and regulatory documentation. Use the tools above to browse, search, validate, and 
            ensure compliance with all organizational and regulatory requirements.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

