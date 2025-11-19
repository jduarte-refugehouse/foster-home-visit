import type { NextRequest } from "next/server"
import { getUserByClerkId, hasPermission, getUserRolesForMicroservice } from "@refugehouse/shared-core/user-management"
import { getEffectiveUser } from "./impersonation"
import { MICROSERVICE_CONFIG } from "./microservice-config"
import { getClerkUserIdFromRequest } from "@refugehouse/shared-core/auth"
import { isSystemAdmin } from "@refugehouse/shared-core/system-admin"

export async function checkPermission(requiredPermission: string | string[], microserviceCode?: string, request?: NextRequest) {
  // SAFE: Use header-based auth for API routes (no middleware required)
  // If request is provided, use headers. Otherwise, this is a server component (not used in API routes)
  let userId: string | null = null
  
  if (request) {
    // API route - use header-based auth
    const auth = getClerkUserIdFromRequest(request)
    userId = auth.clerkUserId
  } else {
    // Server component - this shouldn't happen in API routes, but keep for compatibility
    // Note: Server components should use getEffectiveUser directly
    return { authorized: false, user: null, reason: "checkPermission requires NextRequest for API routes" }
  }

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

  // SECURITY: System admins - check email directly using centralized function
  // Only specific emails can be system admins - this prevents accidental access
  if (user.email && isSystemAdmin(user.email)) {
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
  // SAFE: Use header-based auth for API routes (no middleware required)
  let userId: string | null = null
  
  if (request) {
    // API route - use header-based auth
    const auth = getClerkUserIdFromRequest(request)
    userId = auth.clerkUserId
  } else {
    // Server component - this shouldn't happen in API routes
    return { authorized: false, user: null, reason: "checkRole requires NextRequest for API routes" }
  }

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

  // SECURITY: System admins - check email directly using centralized function
  // Only specific emails can be system admins - this prevents accidental access
  if (user.email && isSystemAdmin(user.email)) {
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
  // SAFE: Use header-based auth for API routes (no middleware required)
  if (!request) {
    throw new Error("requireAuth requires NextRequest for API routes")
  }
  
  const auth = getClerkUserIdFromRequest(request)
  const userId = auth.clerkUserId

  if (!userId) {
    throw new Error("Authentication required: Missing x-user-clerk-id or x-user-email header")
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

export async function requirePermission(permission: string | string[], microserviceCode?: string, request?: NextRequest) {
  const result = await checkPermission(permission, microserviceCode, request)

  if (!result.authorized) {
    throw new Error(`Access denied: ${result.reason}`)
  }

  return result.user
}

export async function requireRole(role: string | string[], microserviceCode?: string, request?: NextRequest) {
  const result = await checkRole(role, microserviceCode, request)

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
  request?: NextRequest,
): Promise<Response> {
  try {
    const user = await requirePermission(requiredPermission, microserviceCode, request)
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
  request?: NextRequest,
): Promise<Response> {
  try {
    const user = await requireRole(requiredRole, microserviceCode, request)
    return await handler(user)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Access denied"
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    })
  }
}
