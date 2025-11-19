"use client"

import { usePermissions } from "@refugehouse/shared-core/hooks/use-permissions"
import type { ReactNode } from "react"

interface ProtectedContentProps {
  children: ReactNode
  requiredPermissions?: string[]
  requiredRoles?: string[]
  fallback?: ReactNode
  requireAll?: boolean
}

export function ProtectedContent({
  children,
  requiredPermissions = [],
  requiredRoles = [],
  fallback = null,
  requireAll = false,
}: ProtectedContentProps) {
  const { permissions, roles, isLoaded } = usePermissions()

  if (!isLoaded) {
    return <div className="animate-pulse bg-gray-200 h-4 rounded"></div>
  }

  // Check if user has required permissions
  const hasPermissions =
    requiredPermissions.length === 0 ||
    (requireAll
      ? requiredPermissions.every((perm) => permissions.includes(perm))
      : requiredPermissions.some((perm) => permissions.includes(perm)))

  // Check if user has required roles
  const hasRoles =
    requiredRoles.length === 0 ||
    (requireAll
      ? requiredRoles.every((role) => roles.includes(role))
      : requiredRoles.some((role) => roles.includes(role)))

  if (hasPermissions && hasRoles) {
    return <>{children}</>
  }

  return <>{fallback}</>
}
