// 🔒🔒🔒 DATABASE CONNECTION LOCK FILE 🔒🔒🔒
// THIS FILE EXISTS TO PREVENT ACCIDENTAL CHANGES TO WORKING DATABASE CONNECTION CODE
//
// ⚠️ CRITICAL RULES FOR v0 AI ASSISTANT ⚠️
// 1. NEVER modify lib/db.ts without EXPLICIT user permission
// 2. NEVER change database connection parameters (user, server, database, etc.)
// 3. NEVER modify SOCKS proxy implementation
// 4. NEVER change Azure Key Vault authentication code
// 5. NEVER add/remove/modify database-related dependencies in package.json
// 6. NEVER suggest "better" or "more elegant" connection approaches
// 7. IF the connection is working, DO NOT TOUCH IT
//
// 🚨 VIOLATION CONSEQUENCES 🚨
// If v0 violates these rules, the user will have to:
// - Deal with lockfile errors
// - Lose development time
// - Manually restore working code
// - Experience deployment failures
//
// 🔐 LOCKED COMPONENTS 🔐
// - lib/db.ts (entire file)
// - Database connection parameters
// - SOCKS proxy configuration
// - Azure Key Vault authentication
// - Database-related package.json dependencies
//
// 📋 WHAT v0 CAN DO INSTEAD 📋
// - Create NEW files for additional database utilities
// - Add NEW API endpoints that USE the existing connection
// - Create NEW components that consume database data
// - Modify UI components and pages
// - Add NEW features that don't touch connection code
//
// 🔍 BEFORE MAKING ANY DATABASE-RELATED CHANGES 🔍
// v0 MUST ask these questions:
// 1. "Does this change affect lib/db.ts?" → If YES, STOP and ask user permission
// 2. "Does this change database connection parameters?" → If YES, STOP and ask user permission
// 3. "Does this modify SOCKS/proxy code?" → If YES, STOP and ask user permission
// 4. "Does this change Key Vault authentication?" → If YES, STOP and ask user permission
// 5. "Does this add/remove database dependencies?" → If YES, STOP and ask user permission
//
// 💡 REMEMBER 💡
// The user has explicitly stated: "unless I tell you to make a change to the connection details,
// YOU ABSOLUTELY SHOULD NOT DO IT, even if you think there is a smarter way."
//
// This is not a suggestion - this is a HARD REQUIREMENT.

export const CONNECTION_LOCK = {
  isLocked: true,
  lockedFiles: ["lib/db.ts", "package.json (database dependencies only)"],
  lockedComponents: [
    "Database connection parameters",
    "SOCKS proxy implementation",
    "Azure Key Vault authentication",
    "Connection pool configuration",
  ],
  lastWorkingVersion: "Current version as of connection fix",
  userInstructions: "DO NOT MODIFY CONNECTION CODE WITHOUT EXPLICIT PERMISSION",
} as const

// This function should be called before any database-related modifications
export function checkConnectionLock(proposedChange: string): { allowed: boolean; reason: string } {
  const forbiddenKeywords = [
    "lib/db.ts",
    "database connection",
    "connection parameters",
    "SOCKS proxy",
    "Key Vault auth",
    "mssql config",
    "connection pool",
    "database credentials",
  ]

  const changeContainsForbiddenKeyword = forbiddenKeywords.some((keyword) =>
    proposedChange.toLowerCase().includes(keyword.toLowerCase()),
  )

  if (changeContainsForbiddenKeyword) {
    return {
      allowed: false,
      reason: `Proposed change affects locked database connection components. User permission required.`,
    }
  }

  return {
    allowed: true,
    reason: "Change does not affect locked connection components.",
  }
}
