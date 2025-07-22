"use client"

import { useState, useEffect } from "react"
import { usePermissions } from "@/hooks/use-permissions"
import AdminDashboard from "@/components/dashboards/admin-dashboard"
import StaffDashboard from "@/components/dashboards/staff-dashboard"
import ExternalUserDashboard from "@/components/dashboards/external-user-dashboard"
import NoPermissionsDashboard from "@/components/dashboards/no-permissions-dashboard"
import SchedulingAdminDashboard from "@/components/dashboards/scheduling-admin-dashboard"
import QADirectorDashboard from "@/components/dashboards/qa-director-dashboard"
import CaseManagerDashboard from "@/components/dashboards/case-manager-dashboard"
import HomeVisitLiaisonDashboard from "@/components/dashboards/home-visit-liaison-dashboard"
import { Skeleton } from "@/components/ui/skeleton"

interface DashboardData {
  overview: {
    totalHomes: number
    mappedHomes: number
    coordinateCompleteness: number
    activeCaseManagers: number
    serviceUnits: number
  }
  distribution: {
    byUnit: Record<string, number>
    byCaseManager: Record<string, number>
  }
  caseManagerWorkload: Array<{
    manager: string
    homeCount: number
    isUnassigned: boolean
  }>
  recentActivity: Array<{
    action: string
    timestamp: string
    type: string
  }>
  lastUpdated: string
}

export default function DashboardPage() {
  const { isLoaded, hasRole, coreRole, isSystemAdmin } = usePermissions()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchDashboardData = async () => {
    setLoading(true)
    setError(null)

    try {
      console.log("📊 Fetching dashboard data...")
      const response = await fetch("/api/dashboard-data")

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()

      if (result.success) {
        setData(result.data)
        console.log("✅ Dashboard data loaded successfully")
      } else {
        throw new Error(result.error || "Failed to fetch dashboard data")
      }
    } catch (err) {
      console.error("❌ Error fetching dashboard data:", err)
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
  }, [])

  if (!isLoaded) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-1/4" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <Skeleton className="h-64" />
      </div>
    )
  }

  // Render dashboards based on roles
  if (isSystemAdmin || hasRole("qa_director")) {
    return <QADirectorDashboard />
  }
  if (hasRole("scheduling_admin")) {
    return <SchedulingAdminDashboard />
  }
  if (hasRole("case_manager")) {
    return <CaseManagerDashboard />
  }
  if (hasRole("home_visit_liaison")) {
    return <HomeVisitLiaisonDashboard />
  }
  if (coreRole === "staff") {
    return <StaffDashboard />
  }
  if (coreRole === "external") {
    return <ExternalUserDashboard />
  }
  if (coreRole === "admin") {
    return <AdminDashboard />
  }

  return <NoPermissionsDashboard />
}
