/**
 * @shared-core
 * This file should be moved to packages/shared-core/lib/system-admin-check.ts
 * Centralized system admin check - only specific emails can be system admins
 * This prevents accidental access grants
 */

/**
 * List of system admin emails - ONLY these emails get system admin access
 * Add new system admins here explicitly
 */
const SYSTEM_ADMIN_EMAILS = [
  "jduarte@refugehouse.org",
  // Add other system admin emails here as needed
] as const

/**
 * Check if an email is a system admin
 * This is the ONLY way system admin access should be checked
 * @param email - User's email address
 * @returns true if email is in the system admin list
 */
export function isSystemAdmin(email: string): boolean {
  return SYSTEM_ADMIN_EMAILS.includes(email.toLowerCase() as any)
}

/**
 * Get list of system admin emails (for display purposes only)
 */
export function getSystemAdminEmails(): readonly string[] {
  return SYSTEM_ADMIN_EMAILS
}

