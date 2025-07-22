"use client"

import { useUser } from "@clerk/nextjs"
import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { AlertTriangle } from "lucide-react"
import dynamic from "next/dynamic"

// Dynamically import dashboard components
const AdminDashboard = dynamic(() => import("@/components/dashboards/admin-dashboard"), {
  loading: () => <DashboardSkeleton />,
})
const StaffDashboard = dynamic(() => import("@/components/dashboards/staff-dashboard"), {
  loading: () => <DashboardSkeleton />,
})
const ExternalUserDashboard = dynamic(() => import("@/components/dashboards/external-user-dashboard"), {
  loading: () => <DashboardSkeleton />,
})
const NoPermissionsDashboard = dynamic(() => import("@/components/dashboards/no-permissions-dashboard"), {
  loading: () => <DashboardSkeleton />,
})
const SchedulingAdminDashboard = dynamic(() => import("@/components/dashboards/scheduling-admin-dashboard"), {
  loading: () => <DashboardSkeleton />,
})
const QADirectorDashboard = dynamic(() => import("@/components/dashboards/qa-director-dashboard"), {
  loading: () => <DashboardSkeleton />,
})
const CaseManagerDashboard = dynamic(() => import("@/components/dashboards/case-manager-dashboard"), {
  loading: () => <DashboardSkeleton />,
})
const HomeVisitLiaisonDashboard = dynamic(() => import("@/components/dashboards/home-visit-liaison-dashboard"), {
  loading: () => <DashboardSkeleton />,
})

interface AppUser {
  id: string
  clerk_user_id: string
  email: string
  first_name: string
  last_name: string
  is_active: boolean
  created_at: string
  updated_at: string
}

interface UserRole {
  role_name: string
  app_name: string
}

interface UserPermission {
  permission_code: string
  permission_name: string
  app_name: string
}

interface DatabaseUserInfo {
  appUser: AppUser
  roles: UserRole[]
  permissions: UserPermission[]
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg p-6">
        <Skeleton className="h-8 w-64 mb-2" />
        <Skeleton className="h-4 w-96" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const { isLoaded, isSignedIn, user } = useUser()
  const [dbUserInfo, setDbUserInfo] = useState<DatabaseUserInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [requiresInvitation, setRequiresInvitation] = useState(false)

  useEffect(() => {
    if (isLoaded && isSignedIn && user) {
      fetchUserInfo()
    }
  }, [isLoaded, isSignedIn, user])

  const fetchUserInfo = async () => {
    if (!user) return

    setLoading(true)
    setError(null)
    setRequiresInvitation(false)

    try {
      const response = await fetch("/api/auth-test/user-info", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          clerkUserId: user.id,
          email: user.primaryEmailAddress?.emailAddress,
          firstName: user.firstName,
          lastName: user.lastName,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        if (response.status === 403 && errorData.requiresInvitation) {
          setRequiresInvitation(true)
        }
        throw new Error(errorData.error || "Failed to fetch user info")
      }

      const data = await response.json()
      setDbUserInfo(data)
    } catch (error) {
      console.error("Error fetching user info:", error)
      setError(error instanceof Error ? error.message : "Unknown error")
    } finally {
      setLoading(false)
    }
  }

  const getDashboardComponent = () => {
    if (!dbUserInfo) return null

    const { permissions, roles } = dbUserInfo
    const email = dbUserInfo.appUser.email

    // Check for global admin
    if (email === "jduarte@refugehouse.org" || roles.some((role) => role.role_name === "global_admin")) {
      return <AdminDashboard />
    }

    // Check for specific roles
    if (roles.some((role) => role.role_name === "scheduling_admin")) {
      return <SchedulingAdminDashboard />
    }

    if (roles.some((role) => role.role_name === "qa_director")) {
      return <QADirectorDashboard />
    }

    if (roles.some((role) => role.role_name === "case_manager")) {
      return <CaseManagerDashboard />
    }

    if (roles.some((role) => role.role_name === "home_visit_liaison")) {
      return <HomeVisitLiaisonDashboard />
    }

    // Check for staff with permissions
    if (email.endsWith("@refugehouse.org") && permissions.length > 0) {
      return <StaffDashboard />
    }

    // External users with permissions
    if (!email.endsWith("@refugehouse.org") && permissions.length > 0) {
      return <ExternalUserDashboard />
    }

    // No permissions
    return <NoPermissionsDashboard />
  }

  if (!isLoaded || loading) {
    return <DashboardSkeleton />
  }

  if (!isSignedIn) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card>
          <CardContent className="p-6">
            <p>Please sign in to access the dashboard.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (requiresInvitation) {
    return (
      <div className="space-y-6">
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-800">
              <AlertTriangle className="h-5 w-5" />
              Invitation Required
            </CardTitle>
            <CardDescription className="text-orange-700">
              External users need an invitation to access the system. Please contact an administrator.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-orange-800 mb-2">Contact Information:</h4>
                <p className="text-sm text-orange-700">Email: jduarte@refugehouse.org</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-800">
              <AlertTriangle className="h-5 w-5" />
              Error Loading Dashboard
            </CardTitle>
            <CardDescription className="text-red-700">
              There was an error loading your dashboard information.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-red-700">{error}</p>
              <button onClick={fetchUserInfo} className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">
                Retry
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return getDashboardComponent()
}
