import { cookies } from "next/headers"
import type { NextRequest } from "next/server"
import { query } from "./db"
import { AppUser } from "./user-management"

const IMPERSONATION_COOKIE_NAME = "impersonate_user_id"
const IMPERSONATION_ADMIN_COOKIE_NAME = "impersonate_admin_id"

/**
 * Get the currently impersonated user ID (if any)
 * Returns null if not impersonating
 * Can be used in both API routes (with request) and server components (without request)
 */
export async function getImpersonatedUserId(request?: NextRequest): Promise<string | null> {
  try {
    if (request) {
      // API route context - use request.cookies
      const impersonatedUserId = request.cookies.get(IMPERSONATION_COOKIE_NAME)?.value
      return impersonatedUserId || null
    } else {
      // Server component context - use cookies()
      // Note: cookies() will throw in API route context, so we catch and return null
      try {
        const cookieStore = await cookies()
        const impersonatedUserId = cookieStore.get(IMPERSONATION_COOKIE_NAME)?.value
        return impersonatedUserId || null
      } catch (cookieError) {
        // cookies() not available (likely in API route without request)
        // Return null to fall back to real user
        return null
      }
    }
  } catch (error) {
    // Fallback: return null if anything fails
    console.error("Error reading impersonation cookie:", error)
    return null
  }
}

/**
 * Get the admin user ID who is impersonating (if any)
 */
export async function getImpersonationAdminId(request?: NextRequest): Promise<string | null> {
  try {
    if (request) {
      // API route context - use request.cookies
      const adminId = request.cookies.get(IMPERSONATION_ADMIN_COOKIE_NAME)?.value
      return adminId || null
    } else {
      // Server component context - use cookies()
      const cookieStore = await cookies()
      const adminId = cookieStore.get(IMPERSONATION_ADMIN_COOKIE_NAME)?.value
      return adminId || null
    }
  } catch (error) {
    console.error("Error reading impersonation admin cookie:", error)
    return null
  }
}

/**
 * Get the effective user ID (impersonated user if impersonating, otherwise the real user)
 * Can be used in both API routes (with request) and server components (without request)
 */
export async function getEffectiveUserId(realUserId: string, request?: NextRequest): Promise<string> {
  const impersonatedUserId = await getImpersonatedUserId(request)
  return impersonatedUserId || realUserId
}

/**
 * Get the effective user (app_user) - impersonated user if impersonating, otherwise the real user
 * Can be used in both API routes (with request) and server components (without request)
 * 
 * Note: In API routes, pass the request. In server components, don't pass it.
 */
export async function getEffectiveUser(realClerkUserId: string, request?: NextRequest): Promise<AppUser | null> {
  try {
    const impersonatedUserId = await getImpersonatedUserId(request)
    
    if (impersonatedUserId) {
      // Return the impersonated user
      const result = await query<AppUser>("SELECT * FROM app_users WHERE id = @param0", [impersonatedUserId])
      return result[0] || null
    }
    
    // Return the real user
    const result = await query<AppUser>("SELECT * FROM app_users WHERE clerk_user_id = @param0", [realClerkUserId])
    return result[0] || null
  } catch (error) {
    // If cookies() fails (e.g., in API route without request), fall back to real user
    console.error("Error getting effective user, falling back to real user:", error)
    const result = await query<AppUser>("SELECT * FROM app_users WHERE clerk_user_id = @param0", [realClerkUserId])
    return result[0] || null
  }
}

/**
 * Check if the current user is impersonating another user
 */
export async function isImpersonating(): Promise<boolean> {
  const impersonatedUserId = await getImpersonatedUserId()
  return !!impersonatedUserId
}

/**
 * Set impersonation cookie (server-side only, called from API route)
 */
export function setImpersonationCookie(userId: string, adminId: string) {
  // This is a helper - actual cookie setting should be done in API route using NextResponse
  return {
    userId,
    adminId,
  }
}

/**
 * Clear impersonation cookies
 */
export function clearImpersonationCookies() {
  // This is a helper - actual cookie clearing should be done in API route
  return {
    clear: true,
  }
}

