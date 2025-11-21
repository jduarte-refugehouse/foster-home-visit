"use client"

import { useState, useEffect, useCallback, useRef } from "react"

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

/**
 * PROTOCOL: Does NOT use Clerk hooks after authentication.
 * Gets Clerk ID from session API, then uses headers for API calls.
 * Follows "deaf/mute/blind" protocol for Clerk after initial authentication.
 */
export function usePermissions(): UserPermissions {
  const [permissionData, setPermissionData] = useState<UserPermissions>(createDefaultPermissions())
  const [isLoading, setIsLoading] = useState(true)
  const sessionUserRef = useRef<{ id: string; email: string; name: string } | null>(null)

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
    const fetchPermissions = async () => {
      setIsLoading(true)

      try {
        // Step 1: Get Clerk ID from session (NO Clerk hooks)
        if (!sessionUserRef.current) {
          // Check sessionStorage first
          const storedUser = sessionStorage.getItem("session_user")
          if (storedUser) {
            try {
              const parsed = JSON.parse(storedUser)
              if (parsed.clerkUserId) {
                sessionUserRef.current = {
                  id: parsed.clerkUserId,
                  email: parsed.email || "",
                  name: parsed.name || "",
                }
              }
            } catch (e) {
              // Invalid stored data, fetch fresh
            }
          }

          // If not in sessionStorage, fetch from API (uses Clerk server-side ONCE)
          if (!sessionUserRef.current) {
            const sessionResponse = await fetch("/api/auth/get-session-user", {
              method: "GET",
              credentials: "include",
            })

            if (!sessionResponse.ok) {
              setPermissionData({ ...createDefaultPermissions(), isLoaded: true })
              setIsLoading(false)
              return
            }

            const sessionData = await sessionResponse.json()
            if (sessionData.success && sessionData.clerkUserId) {
              sessionUserRef.current = {
                id: sessionData.clerkUserId,
                email: sessionData.email || "",
                name: sessionData.name || "",
              }
              // Store in sessionStorage
              sessionStorage.setItem("session_user", JSON.stringify({
                clerkUserId: sessionData.clerkUserId,
                email: sessionData.email,
                name: sessionData.name,
              }))
            } else {
              setPermissionData({ ...createDefaultPermissions(), isLoaded: true })
              setIsLoading(false)
              return
            }
          }
        }

        // Step 2: Fetch permissions using headers (NO Clerk hooks)
        if (!sessionUserRef.current) {
          setPermissionData({ ...createDefaultPermissions(), isLoaded: true })
          setIsLoading(false)
          return
        }

        const headers: HeadersInit = {
          "x-user-email": sessionUserRef.current.email,
          "x-user-clerk-id": sessionUserRef.current.id,
          "x-user-name": sessionUserRef.current.name,
        }

        const response = await fetch("/api/permissions", {
          headers,
          credentials: 'include', // Include cookies for session
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
      } finally {
        setIsLoading(false)
      }
    }

    fetchPermissions()
  }, [constructPermissionSet]) // Empty deps - only run once on mount

  return permissionData
}
