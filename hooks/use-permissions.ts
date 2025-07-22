"use client"

import { useState, useEffect } from "react"

export interface UserPermissions {
  // Core user info
  userId: string | null
  email: string | null
  coreRole: string | null

  // Microservice-specific data
  roles: Array<{
    roleName: string
    roleDisplayName: string
    roleLevel: number
    microservice: string
  }>
  permissions: Array<{
    permissionCode: string
    permissionName: string
    category: string
    microservice: string
  }>

  // Computed properties
  isLoaded: boolean
  isSystemAdmin: boolean
  isAgencyAdmin: boolean

  // Helper functions
  hasRole: (roleName: string, microservice?: string) => boolean
  hasPermission: (permissionCode: string, microservice?: string) => boolean
  canPerformAction: (action: string, context?: any) => boolean
  getRolesForMicroservice: (microservice: string) => string[]
  getPermissionsForMicroservice: (microservice: string) => string[]
}

// Test users for development - maps to your specific examples
export const TEST_USERS = {
  // System Administrator
  jduarte: {
    userId: "user-1",
    email: "jduarte@refugehouse.org",
    coreRole: "system_admin",
    roles: [
      { roleName: "qa_director", roleDisplayName: "QA Director", roleLevel: 4, microservice: "home-visits" },
      { roleName: "system_admin", roleDisplayName: "System Administrator", roleLevel: 5, microservice: "home-visits" },
    ],
    permissions: [
      {
        permissionCode: "schedule_create",
        permissionName: "Create Schedules",
        category: "scheduling",
        microservice: "home-visits",
      },
      {
        permissionCode: "schedule_edit",
        permissionName: "Edit Schedules",
        category: "scheduling",
        microservice: "home-visits",
      },
      {
        permissionCode: "visit_conduct",
        permissionName: "Conduct Visits",
        category: "visits",
        microservice: "home-visits",
      },
      {
        permissionCode: "visit_report_create",
        permissionName: "Create Visit Reports",
        category: "visits",
        microservice: "home-visits",
      },
      {
        permissionCode: "qa_review_all",
        permissionName: "Review All QA",
        category: "quality",
        microservice: "home-visits",
      },
      { permissionCode: "user_manage", permissionName: "Manage Users", category: "admin", microservice: "home-visits" },
      {
        permissionCode: "system_config",
        permissionName: "System Configuration",
        category: "admin",
        microservice: "home-visits",
      },
    ],
  },

  // Scheduling Admin - Michele Gorman
  mgorman: {
    userId: "user-2",
    email: "mgorman@refugehouse.org",
    coreRole: "staff",
    roles: [
      {
        roleName: "scheduling_admin",
        roleDisplayName: "Scheduling Administrator",
        roleLevel: 3,
        microservice: "home-visits",
      },
    ],
    permissions: [
      {
        permissionCode: "schedule_create",
        permissionName: "Create Schedules",
        category: "scheduling",
        microservice: "home-visits",
      },
      {
        permissionCode: "schedule_edit",
        permissionName: "Edit Schedules",
        category: "scheduling",
        microservice: "home-visits",
      },
      {
        permissionCode: "schedule_delete",
        permissionName: "Delete Schedules",
        category: "scheduling",
        microservice: "home-visits",
      },
      {
        permissionCode: "schedule_view_all",
        permissionName: "View All Schedules",
        category: "scheduling",
        microservice: "home-visits",
      },
      { permissionCode: "home_view", permissionName: "View Homes", category: "basic", microservice: "home-visits" },
      {
        permissionCode: "dashboard_view",
        permissionName: "View Dashboard",
        category: "basic",
        microservice: "home-visits",
      },
    ],
  },

  // Home Visit Liaison - Gabe Groman
  ggroman: {
    userId: "user-3",
    email: "ggroman@refugehouse.org",
    coreRole: "staff",
    roles: [
      {
        roleName: "home_visit_liaison",
        roleDisplayName: "Home Visit Liaison",
        roleLevel: 2,
        microservice: "home-visits",
      },
    ],
    permissions: [
      {
        permissionCode: "visit_conduct",
        permissionName: "Conduct Visits",
        category: "visits",
        microservice: "home-visits",
      },
      {
        permissionCode: "visit_report_create",
        permissionName: "Create Visit Reports",
        category: "visits",
        microservice: "home-visits",
      },
      {
        permissionCode: "visit_report_edit",
        permissionName: "Edit Visit Reports",
        category: "visits",
        microservice: "home-visits",
      },
      { permissionCode: "home_view", permissionName: "View Homes", category: "basic", microservice: "home-visits" },
      {
        permissionCode: "dashboard_view",
        permissionName: "View Dashboard",
        category: "basic",
        microservice: "home-visits",
      },
    ],
  },

  // Case Manager - Heather Sartin
  hsartin: {
    userId: "user-4",
    email: "hsartin@refugehouse.org",
    coreRole: "staff",
    roles: [{ roleName: "case_manager", roleDisplayName: "Case Manager", roleLevel: 2, microservice: "home-visits" }],
    permissions: [
      {
        permissionCode: "case_view_assigned",
        permissionName: "View Assigned Cases",
        category: "cases",
        microservice: "home-visits",
      },
      { permissionCode: "case_edit", permissionName: "Edit Cases", category: "cases", microservice: "home-visits" },
      {
        permissionCode: "visit_report_view",
        permissionName: "View Visit Reports",
        category: "visits",
        microservice: "home-visits",
      },
      {
        permissionCode: "visit_report_approve",
        permissionName: "Approve Visit Reports",
        category: "visits",
        microservice: "home-visits",
      },
      { permissionCode: "home_view", permissionName: "View Homes", category: "basic", microservice: "home-visits" },
      {
        permissionCode: "dashboard_view",
        permissionName: "View Dashboard",
        category: "basic",
        microservice: "home-visits",
      },
    ],
  },

  // QA Director - Sheila Mathis
  smathis: {
    userId: "user-5",
    email: "smathis@refugehouse.org",
    coreRole: "staff",
    roles: [{ roleName: "qa_director", roleDisplayName: "QA Director", roleLevel: 4, microservice: "home-visits" }],
    permissions: [
      {
        permissionCode: "qa_review_all",
        permissionName: "Review All QA",
        category: "quality",
        microservice: "home-visits",
      },
      { permissionCode: "qa_approve", permissionName: "Approve QA", category: "quality", microservice: "home-visits" },
      { permissionCode: "qa_reports", permissionName: "QA Reports", category: "quality", microservice: "home-visits" },
      {
        permissionCode: "visit_report_view",
        permissionName: "View Visit Reports",
        category: "visits",
        microservice: "home-visits",
      },
      {
        permissionCode: "case_view_all",
        permissionName: "View All Cases",
        category: "cases",
        microservice: "home-visits",
      },
      { permissionCode: "home_view", permissionName: "View Homes", category: "basic", microservice: "home-visits" },
      {
        permissionCode: "dashboard_view",
        permissionName: "View Dashboard",
        category: "basic",
        microservice: "home-visits",
      },
    ],
  },

  // External user with no permissions
  external: {
    userId: "user-6",
    email: "external@example.com",
    coreRole: "external",
    roles: [],
    permissions: [],
  },
} as const

export function usePermissions(): UserPermissions {
  const [permissionData, setPermissionData] = useState<UserPermissions>({
    userId: null,
    email: null,
    coreRole: null,
    roles: [],
    permissions: [],
    isLoaded: false,
    isSystemAdmin: false,
    isAgencyAdmin: false,
    hasRole: () => false,
    hasPermission: () => false,
    canPerformAction: () => false,
    getRolesForMicroservice: () => [],
    getPermissionsForMicroservice: () => [],
  })

  useEffect(() => {
    // For now, use localStorage to simulate different users
    const testUserKey = localStorage.getItem("test-user-type") || "hsartin"
    const userData = TEST_USERS[testUserKey as keyof typeof TEST_USERS] || TEST_USERS.hsartin

    const hasRole = (roleName: string, microservice = "home-visits"): boolean => {
      return userData.roles.some((role) => role.roleName === roleName && role.microservice === microservice)
    }

    const hasPermission = (permissionCode: string, microservice = "home-visits"): boolean => {
      return userData.permissions.some(
        (perm) => perm.permissionCode === permissionCode && perm.microservice === microservice,
      )
    }

    const canPerformAction = (action: string, context?: any): boolean => {
      // Check if user has the specific permission
      if (hasPermission(action)) {
        return true
      }

      // Check role-based permissions
      if (userData.coreRole === "system_admin") {
        return true
      }

      // Context-specific checks could go here
      return false
    }

    const getRolesForMicroservice = (microservice: string): string[] => {
      return userData.roles.filter((role) => role.microservice === microservice).map((role) => role.roleName)
    }

    const getPermissionsForMicroservice = (microservice: string): string[] => {
      return userData.permissions
        .filter((perm) => perm.microservice === microservice)
        .map((perm) => perm.permissionCode)
    }

    setPermissionData({
      userId: userData.userId,
      email: userData.email,
      coreRole: userData.coreRole,
      roles: userData.roles,
      permissions: userData.permissions,
      isLoaded: true,
      isSystemAdmin: userData.coreRole === "system_admin",
      isAgencyAdmin: userData.roles.some((r) => r.roleName === "qa_director" || r.roleName === "scheduling_admin"),
      hasRole,
      hasPermission,
      canPerformAction,
      getRolesForMicroservice,
      getPermissionsForMicroservice,
    })
  }, [])

  return permissionData
}

export function setTestUser(userKey: keyof typeof TEST_USERS) {
  localStorage.setItem("test-user-type", userKey)
  window.location.reload()
}

export function getCurrentTestUser(): keyof typeof TEST_USERS {
  return (localStorage.getItem("test-user-type") as keyof typeof TEST_USERS) || "hsartin"
}
