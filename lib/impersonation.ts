import { cookies } from "next/headers"
import { query } from "./db"
import { AppUser } from "./user-management"

const IMPERSONATION_COOKIE_NAME = "impersonate_user_id"
const IMPERSONATION_ADMIN_COOKIE_NAME = "impersonate_admin_id"

/**
 * Get the currently impersonated user ID (if any)
 * Returns null if not impersonating
 */
export async function getImpersonatedUserId(): Promise<string | null> {
  try {
    const cookieStore = await cookies()
    const impersonatedUserId = cookieStore.get(IMPERSONATION_COOKIE_NAME)?.value
    return impersonatedUserId || null
  } catch (error) {
    console.error("Error reading impersonation cookie:", error)
    return null
  }
}

/**
 * Get the admin user ID who is impersonating (if any)
 */
export async function getImpersonationAdminId(): Promise<string | null> {
  try {
    const cookieStore = await cookies()
    const adminId = cookieStore.get(IMPERSONATION_ADMIN_COOKIE_NAME)?.value
    return adminId || null
  } catch (error) {
    console.error("Error reading impersonation admin cookie:", error)
    return null
  }
}

/**
 * Get the effective user ID (impersonated user if impersonating, otherwise the real user)
 */
export async function getEffectiveUserId(realUserId: string): Promise<string> {
  const impersonatedUserId = await getImpersonatedUserId()
  return impersonatedUserId || realUserId
}

/**
 * Get the effective user (app_user) - impersonated user if impersonating, otherwise the real user
 */
export async function getEffectiveUser(realClerkUserId: string): Promise<AppUser | null> {
  const impersonatedUserId = await getImpersonatedUserId()
  
  if (impersonatedUserId) {
    // Return the impersonated user
    const result = await query<AppUser>("SELECT * FROM app_users WHERE id = @param0", [impersonatedUserId])
    return result[0] || null
  }
  
  // Return the real user
  const result = await query<AppUser>("SELECT * FROM app_users WHERE clerk_user_id = @param0", [realClerkUserId])
  return result[0] || null
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

