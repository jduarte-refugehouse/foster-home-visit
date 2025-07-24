"use client"

import { useState, useEffect, useCallback } from "react"
import { useAuth } from "@clerk/nextjs"
import { MICROSERVICE_CONFIG } from "@/lib/microservice-config"

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
  const [permissionData, setPermissionData] = useState<UserPermissions>(createDefaultPermissions())

  const constructPermissionSet = useCallback((data: any): UserPermissions => {
    const hasRole = (roleName: string, microservice = MICROSERVICE_CONFIG.code): boolean => {
      return data.roles?.some((role: any) => role.roleName === roleName && role.microservice === microservice)
    }

    const hasPermission = (permissionCode: string, microservice = MICROSERVICE_CONFIG.code): boolean => {
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
        const response = await fetch("/api/permissions")
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
  }, [isSignedIn, userId, constructPermissionSet])

  return permissionData
}
