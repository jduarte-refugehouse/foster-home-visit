/**
 * DATABASE CONNECTION LOCK SYSTEM
 *
 * This file serves as a safeguard to prevent modifications to the working database connection.
 *
 * 🔒 LOCKED COMPONENTS:
 * - lib/db.ts (entire file)
 * - Database connection parameters
 * - SOCKS proxy configuration
 * - Azure Key Vault authentication
 * - Package dependencies related to database connection
 *
 * 🚫 FORBIDDEN ACTIONS:
 * - Modifying connection strings, usernames, passwords
 * - Changing SOCKS proxy implementation
 * - Altering Azure Key Vault configuration
 * - Adding/removing database-related dependencies
 * - Suggesting "better" or "more elegant" approaches
 * - Refactoring the connection logic
 *
 * ✅ ALLOWED ACTIONS:
 * - Creating NEW files that USE the existing connection
 * - Adding NEW API endpoints that consume the connection
 * - Creating NEW utility functions that call existing query functions
 * - Modifying UI components and pages
 * - Adding features that don't touch connection code
 *
 * ⚠️ CONSEQUENCES OF VIOLATION:
 * - Application will break
 * - User will be frustrated
 * - Development time will be wasted
 * - Trust will be damaged
 *
 * 📋 CHANGE APPROVAL PROCESS:
 * 1. User must explicitly request connection changes
 * 2. User must provide specific permission
 * 3. Changes must be documented with reason
 * 4. Rollback plan must be prepared
 *
 * 🔍 VERIFICATION FUNCTION:
 */
export function canModifyConnection(userPermission = false): boolean {
  if (!userPermission) {
    throw new Error(`
      🔒 CONNECTION MODIFICATION BLOCKED 🔒
      
      You are attempting to modify the database connection without user permission.
      This is forbidden by the connection lock system.
      
      The connection is working and must not be changed unless the user explicitly requests it.
      
      If you need to make database-related changes:
      1. Ask the user for explicit permission
      2. Explain exactly what you want to change and why
      3. Wait for user approval before proceeding
      
      Remember: Working code should not be "improved" without permission.
    `)
  }
  return true
}

/**
 * REGRESSION PREVENTION SYSTEM
 *
 * To prevent breaking working functionality between chats:
 * 1. Always check existing working code before making changes
 * 2. Test functionality before and after modifications
 * 3. Document what was working before changes
 * 4. Create incremental changes, not wholesale replacements
 * 5. Preserve existing API contracts and data structures
 */
export const WORKING_FEATURES = {
  coordinateRetrieval: "WORKING - Do not modify homes-list coordinate display",
  socksConnection: "WORKING - Do not modify SOCKS proxy implementation",
  keyVaultAuth: "WORKING - Do not modify Azure Key Vault authentication",
  databaseQuery: "WORKING - Do not modify core query function",
}
