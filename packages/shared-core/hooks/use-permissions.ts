"use client"

import { useState, useEffect, useCallback } from "react"
import { useAuth, useUser } from "@clerk/nextjs"

export interface UserPermissions {
  userId: string | null
  email: string | null
  coreRole: string | null
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
  isLoaded: boolean
  isSystemAdmin: boolean
  isAgencyAdmin: boolean
  hasRole: (roleName: string, microservice?: string) => boolean
  hasPermission: (permissionCode: string, microservice?: string) => boolean
  canPerformAction: (action: string, context?: any) => boolean
  getRolesForMicroservice: (microservice: string) => string[]
  getPermissionsForMicroservice: (microservice: string) => string[]
}

const createDefaultPermissions = (): UserPermissions => ({
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

export function usePermissions(): UserPermissions {
  const { isSignedIn, userId } = useAuth()
  const { user } = useUser()
  const [permissionData, setPermissionData] = useState<UserPermissions>(createDefaultPermissions())

  const constructPermissionSet = useCallback((data: any): UserPermissions => {
    const hasRole = (roleName: string, microservice = "home-visits"): boolean => {
      return data.roles?.some((role: any) => role.roleName === roleName && role.microservice === microservice)
    }

    const hasPermission = (permissionCode: string, microservice = "home-visits"): boolean => {
      return data.permissions?.some(
        (perm: any) => perm.permissionCode === permissionCode && perm.microservice === microservice,
      )
    }

    const canPerformAction = (action: string, context?: any): boolean => {
      if (hasPermission(action)) return true
      if (data.coreRole === "system_admin") return true
      return false
    }

    const getRolesForMicroservice = (microservice: string): string[] => {
      return (
        data.roles?.filter((role: any) => role.microservice === microservice).map((role: any) => role.roleName) || []
      )
    }

    const getPermissionsForMicroservice = (microservice: string): string[] => {
      return (
        data.permissions
          ?.filter((perm: any) => perm.microservice === microservice)
          .map((perm: any) => perm.permissionCode) || []
      )
    }

    return {
      ...data,
      isLoaded: true,
      isSystemAdmin: data.coreRole === "system_admin",
      isAgencyAdmin:
        data.roles?.some((r: any) => r.roleName === "qa_director" || r.roleName === "scheduling_admin") || false,
      hasRole,
      hasPermission,
      canPerformAction,
      getRolesForMicroservice,
      getPermissionsForMicroservice,
    }
  }, [])

  useEffect(() => {
    if (!isSignedIn) {
      setPermissionData({ ...createDefaultPermissions(), isLoaded: true })
      return
    }

    const fetchPermissions = async () => {
      try {
        // Build headers with user info from Clerk
        const headers: HeadersInit = {
          "Content-Type": "application/json",
        }
        
        // Add authentication headers if user is available
        if (user) {
          if (user.id) {
            headers["x-user-clerk-id"] = user.id
          }
          if (user.emailAddresses?.[0]?.emailAddress) {
            headers["x-user-email"] = user.emailAddresses[0].emailAddress
          }
          if (user.firstName || user.lastName) {
            headers["x-user-name"] = `${user.firstName || ""} ${user.lastName || ""}`.trim()
          }
        }

        const response = await fetch("/api/permissions", {
          headers,
          credentials: 'include', // Ensure cookies are sent (fallback for mobile)
        })
        if (!response.ok) {
          console.error("Failed to fetch permissions:", response.statusText)
          throw new Error("Failed to fetch permissions")
        }
        const data = await response.json()
        if (data.error) {
          console.error("API Error fetching permissions:", data.error, data.details)
          throw new Error(data.error)
        }
        setPermissionData(constructPermissionSet(data))
      } catch (error) {
        console.error("Error in usePermissions hook:", error)
        setPermissionData({ ...createDefaultPermissions(), isLoaded: true })
      }
    }

    fetchPermissions()
  }, [isSignedIn, userId, user, constructPermissionSet])

  return permissionData
}
