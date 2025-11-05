import { auth } from "@clerk/nextjs/server"
import type { NextRequest } from "next/server"
import { getUserByClerkId, hasPermission, getUserRolesForMicroservice } from "./user-management"
import { getEffectiveUser } from "./impersonation"
import { MICROSERVICE_CONFIG } from "./microservice-config"

export async function checkPermission(requiredPermission: string | string[], microserviceCode?: string, request?: NextRequest) {
  const { userId } = await auth()

  if (!userId) {
    return { authorized: false, user: null, reason: "Not authenticated" }
  }

  // Use effective user (impersonated if active, otherwise real user)
  // Pass request if available (for API routes)
  const user = await getEffectiveUser(userId, request)

  if (!user) {
    return { authorized: false, user: null, reason: "User not found in system" }
  }

  if (!user.is_active) {
    return { authorized: false, user, reason: "User account is inactive" }
  }

  const targetMicroservice = microserviceCode || MICROSERVICE_CONFIG.code
  const permissions = Array.isArray(requiredPermission) ? requiredPermission : [requiredPermission]

  // System admins have access to everything
  if (user.core_role === "system_admin") {
    return { authorized: true, user, reason: "System admin access" }
  }

  // Check if user has any of the required permissions
  for (const permission of permissions) {
    const hasAccess = await hasPermission(user.id, permission, targetMicroservice)
    if (hasAccess) {
      return { authorized: true, user, reason: `Has permission: ${permission}` }
    }
  }

  return {
    authorized: false,
    user,
    reason: `Missing required permissions: ${permissions.join(" or ")} for ${targetMicroservice}`,
  }
}

export async function checkRole(requiredRole: string | string[], microserviceCode?: string, request?: NextRequest) {
  const { userId } = await auth()

  if (!userId) {
    return { authorized: false, user: null, reason: "Not authenticated" }
  }

  // Use effective user (impersonated if active, otherwise real user)
  // Pass request if available (for API routes)
  const user = await getEffectiveUser(userId, request)

  if (!user) {
    return { authorized: false, user: null, reason: "User not found in system" }
  }

  if (!user.is_active) {
    return { authorized: false, user, reason: "User account is inactive" }
  }

  const targetMicroservice = microserviceCode || MICROSERVICE_CONFIG.code
  const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole]

  // System admins have access to everything
  if (user.core_role === "system_admin") {
    return { authorized: true, user, reason: "System admin access" }
  }

  // Get user's roles for the target microservice
  const userRoles = await getUserRolesForMicroservice(user.id, targetMicroservice)
  const userRoleNames = userRoles.map((role) => role.role_name)

  // Check if user has any of the required roles
  for (const role of roles) {
    if (userRoleNames.includes(role)) {
      return { authorized: true, user, reason: `Has role: ${role}` }
    }
  }

  return {
    authorized: false,
    user,
    reason: `Missing required roles: ${roles.join(" or ")} for ${targetMicroservice}`,
  }
}

export async function requireAuth(request?: NextRequest) {
  const { userId } = await auth()

  if (!userId) {
    throw new Error("Authentication required")
  }

  // Use effective user (impersonated if active, otherwise real user)
  // Pass request if available (for API routes)
  const user = await getEffectiveUser(userId, request)

  if (!user) {
    throw new Error("User not found in system")
  }

  if (!user.is_active) {
    throw new Error("User account is inactive")
  }

  return { userId, user }
}

export async function requirePermission(permission: string | string[], microserviceCode?: string) {
  const result = await checkPermission(permission, microserviceCode)

  if (!result.authorized) {
    throw new Error(`Access denied: ${result.reason}`)
  }

  return result.user
}

export async function requireRole(role: string | string[], microserviceCode?: string) {
  const result = await checkRole(role, microserviceCode)

  if (!result.authorized) {
    throw new Error(`Access denied: ${result.reason}`)
  }

  return result.user
}

// Helper function for API route protection
export async function withPermissionCheck(
  handler: (user: any) => Promise<Response>,
  requiredPermission: string | string[],
  microserviceCode?: string,
): Promise<Response> {
  try {
    const user = await requirePermission(requiredPermission, microserviceCode)
    return await handler(user)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Access denied"
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    })
  }
}

// Helper function for API route role protection
export async function withRoleCheck(
  handler: (user: any) => Promise<Response>,
  requiredRole: string | string[],
  microserviceCode?: string,
): Promise<Response> {
  try {
    const user = await requireRole(requiredRole, microserviceCode)
    return await handler(user)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Access denied"
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    })
  }
}
