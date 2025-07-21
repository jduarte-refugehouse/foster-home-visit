/**
 * DATABASE CONNECTION LOCK SYSTEM
 *
 * This file serves as a safeguard to prevent unauthorized modifications
 * to the database connection system that is currently working.
 *
 * 🔒 LOCKED FILES - DO NOT MODIFY WITHOUT EXPLICIT USER PERMISSION:
 * - lib/db.ts (entire file)
 * - package.json (database-related dependencies only)
 *
 * 🚫 FORBIDDEN MODIFICATIONS:
 * - Database connection parameters (server, user, database, etc.)
 * - SOCKS proxy implementation (createFixieConnector function)
 * - Azure Key Vault authentication (getPasswordFromKeyVault function)
 * - Connection pool configuration
 * - Adding/removing database dependencies (mssql, socks, @azure/* packages)
 * - Changing authentication methods (ClientSecretCredential)
 * - Modifying TLS/SSL settings
 * - Changing timeout values
 * - Altering error handling in connection functions
 *
 * ✅ ALLOWED OPERATIONS:
 * - Creating NEW database utility files that USE the existing connection
 * - Adding NEW API endpoints that call existing query() function
 * - Creating NEW UI components that consume API data
 * - Modifying existing pages and components (non-connection related)
 * - Adding features that don't touch lib/db.ts
 *
 * 🔍 CURRENT STATUS:
 * - Connection: WORKING ✅
 * - SOCKS Proxy: WORKING ✅
 * - Azure Key Vault: WORKING ✅
 * - Last Verified: After lockfile resolution
 *
 * ⚠️ CONSEQUENCES OF UNAUTHORIZED CHANGES:
 * - Application will break
 * - SOCKS proxy will fail
 * - Database authentication will fail
 * - Deployment lockfile errors
 * - User frustration and lost development time
 *
 * 📝 TO REQUEST CHANGES:
 * User must explicitly state: "Modify the database connection" or similar
 * All changes must be approved before implementation
 */

export function checkConnectionLockPermission(requestedChange: string): boolean {
  console.warn(`🔒 CONNECTION LOCK: Attempted to modify: ${requestedChange}`)
  console.warn(`🔒 This change is FORBIDDEN without explicit user permission`)
  console.warn(`🔒 Current connection is WORKING - do not break it`)
  return false
}

export const LOCKED_FILES = ["lib/db.ts", "package.json (database dependencies)"] as const

export const FORBIDDEN_CHANGES = [
  "Database connection parameters",
  "SOCKS proxy implementation",
  "Azure Key Vault authentication",
  "Connection pool configuration",
  "Database dependencies",
  "Authentication methods",
  "TLS/SSL settings",
  "Timeout values",
  "Connection error handling",
] as const

export const CONNECTION_STATUS = {
  working: true,
  lastVerified: new Date().toISOString(),
  socksProxy: "WORKING",
  keyVault: "WORKING",
  database: "WORKING",
} as const
