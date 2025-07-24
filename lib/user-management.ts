import { query, getDbConnection } from "./db"
import { currentUser } from "@clerk/nextjs/server"
import crypto from "crypto"
import { MICROSERVICE_CONFIG, isInternalUser } from "./microservice-config"

// Use the configurable microservice
export const CURRENT_MICROSERVICE = MICROSERVICE_CONFIG.code

export interface AppUser {
  id: string
  clerk_user_id: string
  email: string
  first_name: string
  last_name: string
  is_active: boolean
  created_at: Date
  updated_at: Date
  // Core organizational role
  core_role: "admin" | "staff" | "external" | "foster_parent"
  department?: string
  job_title?: string
}

export interface MicroserviceApp {
  id: string
  app_code: string
  app_name: string
  app_url: string
  description: string
  is_active: boolean
}

export interface UserRole {
  id: string
  user_id: string
  microservice_id: string
  role_name: string
  role_display_name: string
  granted_by: string
  granted_at: Date
  is_active: boolean
  // Role hierarchy and inheritance
  parent_role_id?: string
  role_level: number // 1=basic, 2=supervisor, 3=admin, 4=system_admin
}

export interface Permission {
  id: string
  microservice_id: string
  permission_code: string
  permission_name: string
  description: string
  category: string
  // Permission grouping and dependencies
  permission_group: string
  requires_permissions?: string[] // JSON array of prerequisite permissions
}

export interface UserPermission {
  id: string
  user_id: string
  permission_id: string
  granted_by: string
  granted_at: Date
  expires_at?: Date
  is_active: boolean
  // Context-specific permissions
  context_type?: string // "all", "unit", "region", "specific_homes"
  context_value?: string // JSON object with context details
}

// Core organizational roles that apply across all microservices
export const CORE_ROLES = {
  SYSTEM_ADMIN: "system_admin",
  AGENCY_ADMIN: "agency_admin",
  STAFF: "staff",
  EXTERNAL: "external",
  FOSTER_PARENT: "foster_parent",
} as const

// Use configurable roles from microservice config
export const MICROSERVICE_ROLES = MICROSERVICE_CONFIG.roles
export const MICROSERVICE_PERMISSIONS = MICROSERVICE_CONFIG.permissions

export async function getCurrentAppUser(): Promise<AppUser | null> {
  const user = await currentUser()
  if (!user) return null

  try {
    const result = await query<AppUser>("SELECT * FROM app_users WHERE clerk_user_id = @param0", [user.id])
    return result[0] || null
  } catch (error) {
    console.error("Error fetching app user:", error)
    return null
  }
}

export async function getUserRolesForMicroservice(userId: string, microserviceCode: string): Promise<UserRole[]> {
  try {
    const result = await query<UserRole>(
      `SELECT ur.*, ma.app_code, ma.app_name 
       FROM user_roles ur
       INNER JOIN microservice_apps ma ON ur.microservice_id = ma.id
       WHERE ur.user_id = @param0 AND ma.app_code = @param1 AND ur.is_active = 1
       ORDER BY ur.role_level DESC, ur.granted_at ASC`,
      [userId, microserviceCode],
    )
    return result
  } catch (error) {
    console.error("Error fetching user roles:", error)
    return []
  }
}

export async function getUserPermissionsForMicroservice(
  userId: string,
  microserviceCode: string,
): Promise<Permission[]> {
  try {
    const result = await query<Permission>(
      `SELECT DISTINCT p.*
       FROM user_permissions up
       INNER JOIN permissions p ON up.permission_id = p.id
       INNER JOIN microservice_apps ma ON p.microservice_id = ma.id
       WHERE up.user_id = @param0 AND ma.app_code = @param1 
       AND up.is_active = 1 AND (up.expires_at IS NULL OR up.expires_at > GETDATE())
       ORDER BY p.category, p.permission_code`,
      [userId, microserviceCode],
    )
    return result
  } catch (error) {
    console.error("Error fetching user permissions:", error)
    return []
  }
}

export async function hasPermission(
  userId: string,
  permissionCode: string,
  microserviceCode: string = CURRENT_MICROSERVICE,
  context?: { type: string; value: any },
): Promise<boolean> {
  try {
    // Check direct permission
    const directPermission = await query<{ count: number }>(
      `SELECT COUNT(*) as count
       FROM user_permissions up
       INNER JOIN permissions p ON up.permission_id = p.id
       INNER JOIN microservice_apps ma ON p.microservice_id = ma.id
       WHERE up.user_id = @param0 AND ma.app_code = @param1 AND p.permission_code = @param2
       AND up.is_active = 1 AND (up.expires_at IS NULL OR up.expires_at > GETDATE())`,
      [userId, microserviceCode, permissionCode],
    )

    if (directPermission[0]?.count > 0) {
      return true
    }

    // Check role-based permissions (roles can inherit permissions)
    // For now, only check direct permissions until role-permission mapping is implemented
    return false
  } catch (error) {
    console.error("Error checking permission:", error)
    return false
  }
}

export async function assignUserToRole(
  userId: string,
  roleName: string,
  microserviceCode: string,
  grantedBy: string,
  context?: { type: string; value: any },
): Promise<void> {
  try {
    const microservice = await query<{ id: string }>("SELECT id FROM microservice_apps WHERE app_code = @param0", [
      microserviceCode,
    ])

    if (microservice.length === 0) {
      throw new Error(`Microservice ${microserviceCode} not found`)
    }

    const microserviceId = microservice[0].id

    // Get role details from microservice config
    const roleConfig = Object.entries(MICROSERVICE_ROLES).find(([key, value]) => value === roleName)
    if (!roleConfig) {
      throw new Error(`Role ${roleName} not found for microservice ${microserviceCode}`)
    }

    // Determine role level and display name
    const roleLevel = roleName.includes("admin")
      ? 4
      : roleName.includes("director")
        ? 3
        : roleName.includes("liaison")
          ? 2
          : 1
    const roleDisplayName = roleName.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())

    // Assign role
    await query(
      `INSERT INTO user_roles (user_id, microservice_id, role_name, role_display_name, role_level, granted_by, granted_at, is_active)
       VALUES (@param0, @param1, @param2, @param3, @param4, @param5, GETDATE(), 1)`,
      [userId, microserviceId, roleName, roleDisplayName, roleLevel, grantedBy],
    )
  } catch (error) {
    console.error("Error assigning user to role:", error)
    throw error
  }
}

export async function createOrUpdateAppUser(clerkUser: any): Promise<AppUser> {
  const email = clerkUser.emailAddresses[0]?.emailAddress
  const firstName = clerkUser.firstName || ""
  const lastName = clerkUser.lastName || ""

  try {
    // Check if user exists
    const existingUser = await query<AppUser>("SELECT * FROM app_users WHERE clerk_user_id = @param0", [clerkUser.id])

    let userId: string

    if (existingUser.length > 0) {
      // Update existing user
      await query(
        `UPDATE app_users 
         SET email = @param1, first_name = @param2, last_name = @param3, updated_at = GETDATE()
         WHERE clerk_user_id = @param0`,
        [clerkUser.id, email, firstName, lastName],
      )
      userId = existingUser[0].id
    } else {
      // Create new user with core role determination
      const coreRole = determineCoreRole(email)
      const newUserResult = await query<{ id: string }>(
        `INSERT INTO app_users (clerk_user_id, email, first_name, last_name, core_role, is_active, created_at, updated_at)
         OUTPUT INSERTED.id
         VALUES (@param0, @param1, @param2, @param3, @param4, 1, GETDATE(), GETDATE())`,
        [clerkUser.id, email, firstName, lastName, coreRole],
      )
      userId = newUserResult[0].id

      // Assign microservice-specific roles based on email and core role
      await assignDefaultMicroserviceRoles(userId, email, coreRole)
    }

    // Return the updated/created user
    const result = await query<AppUser>("SELECT * FROM app_users WHERE clerk_user_id = @param0", [clerkUser.id])
    return result[0]
  } catch (error) {
    console.error("Error creating/updating app user:", error)
    throw error
  }
}

function determineCoreRole(email: string): string {
  if (email === "jduarte@refugehouse.org") {
    return CORE_ROLES.SYSTEM_ADMIN
  }

  if (isInternalUser(email)) {
    return CORE_ROLES.STAFF
  }

  return CORE_ROLES.EXTERNAL
}

async function assignDefaultMicroserviceRoles(userId: string, email: string, coreRole: string): Promise<void> {
  try {
    // Get current microservice ID
    const microservice = await query<{ id: string }>("SELECT id FROM microservice_apps WHERE app_code = @param0", [
      CURRENT_MICROSERVICE,
    ])

    if (microservice.length === 0) {
      console.error(`Microservice ${CURRENT_MICROSERVICE} not found in database`)
      return
    }

    const microserviceId = microservice[0].id

    // Assign roles based on specific email addresses (Refuge House specific)
    if (email === "jduarte@refugehouse.org") {
      await assignUserToRole(userId, MICROSERVICE_ROLES.QA_DIRECTOR, CURRENT_MICROSERVICE, "system")
    } else if (email === "mgorman@refugehouse.org") {
      await assignUserToRole(userId, MICROSERVICE_ROLES.SCHEDULING_ADMIN, CURRENT_MICROSERVICE, "system")
    } else if (email === "ggroman@refugehouse.org") {
      await assignUserToRole(userId, MICROSERVICE_ROLES.HOME_VISIT_LIAISON, CURRENT_MICROSERVICE, "system")
    } else if (email === "hsartin@refugehouse.org") {
      await assignUserToRole(userId, MICROSERVICE_ROLES.CASE_MANAGER, CURRENT_MICROSERVICE, "system")
    } else if (email === "smathis@refugehouse.org") {
      await assignUserToRole(userId, MICROSERVICE_ROLES.QA_DIRECTOR, CURRENT_MICROSERVICE, "system")
    } else if (coreRole === CORE_ROLES.STAFF) {
      // Default staff role
      await assignUserToRole(userId, MICROSERVICE_ROLES.VIEWER, CURRENT_MICROSERVICE, "system")
    } else if (coreRole === CORE_ROLES.EXTERNAL) {
      // External users need invitation
      await assignUserToRole(userId, MICROSERVICE_ROLES.FOSTER_PARENT, CURRENT_MICROSERVICE, "system")
    }
  } catch (error) {
    console.error("Error assigning default microservice roles:", error)
  }
}

export async function getUserProfile(userId: string): Promise<{
  user: AppUser
  roles: UserRole[]
  permissions: Permission[]
  microservices: string[]
}> {
  try {
    const user = await query<AppUser>("SELECT * FROM app_users WHERE id = @param0", [userId])

    if (user.length === 0) {
      throw new Error("User not found")
    }

    const roles = await query<UserRole>(
      `SELECT ur.*, ma.app_name, ma.app_code
       FROM user_roles ur
       INNER JOIN microservice_apps ma ON ur.microservice_id = ma.id
       WHERE ur.user_id = @param0 AND ur.is_active = 1
       ORDER BY ma.app_name, ur.role_level DESC`,
      [userId],
    )

    const permissions = await query<Permission>(
      `SELECT DISTINCT p.*, ma.app_name, ma.app_code
       FROM user_permissions up
       INNER JOIN permissions p ON up.permission_id = p.id
       INNER JOIN microservice_apps ma ON p.microservice_id = ma.id
       WHERE up.user_id = @param0 AND up.is_active = 1
       ORDER BY ma.app_name, p.category, p.permission_code`,
      [userId],
    )

    const microservices = [...new Set(roles.map((r) => r.microservice_id))]

    return {
      user: user[0],
      roles,
      permissions,
      microservices,
    }
  } catch (error) {
    console.error("Error fetching user profile:", error)
    throw error
  }
}

// Helper function to check if user can perform action in specific context
export async function canUserPerformAction(
  userId: string,
  action: string,
  context: {
    microservice: string
    resourceType?: string
    resourceId?: string
    unitId?: string
  },
): Promise<boolean> {
  try {
    // Check if user has the required permission
    const hasDirectPermission = await hasPermission(userId, action, context.microservice)

    if (!hasDirectPermission) {
      return false
    }

    // Check context-specific restrictions
    if (context.unitId) {
      const contextPermission = await query<{ count: number }>(
        `SELECT COUNT(*) as count
         FROM user_permissions up
         INNER JOIN permissions p ON up.permission_id = p.id
         INNER JOIN microservice_apps ma ON p.microservice_id = ma.id
         WHERE up.user_id = @param0 AND ma.app_code = @param1 AND p.permission_code = @param2
         AND up.is_active = 1 
         AND (up.context_type IS NULL OR up.context_type = 'all' 
              OR (up.context_type = 'unit' AND JSON_VALUE(up.context_value, '$.unit_id') = @param3))`,
        [userId, context.microservice, action, context.unitId],
      )

      return contextPermission[0]?.count > 0
    }

    return true
  } catch (error) {
    console.error("Error checking user action permission:", error)
    return false
  }
}

export async function isUserAuthorized(email: string): Promise<boolean> {
  // Internal users (refugehouse.org) are always authorized
  if (isInternalUser(email)) {
    return true
  }

  // External users must be explicitly invited
  try {
    const result = await query<{ count: number }>(
      "SELECT COUNT(*) as count FROM invited_users WHERE email = @param0 AND is_active = 1",
      [email],
    )
    return result[0]?.count > 0
  } catch (error) {
    console.error("Error checking user authorization:", error)
    return false
  }
}

export async function getAllMicroservices(): Promise<MicroserviceApp[]> {
  try {
    const result = await query<MicroserviceApp>("SELECT * FROM microservice_apps WHERE is_active = 1 ORDER BY app_name")
    return result
  } catch (error) {
    console.error("Error fetching microservices:", error)
    return []
  }
}

export async function getUsersWithRolesAndPermissions(): Promise<any[]> {
  try {
    const result = await query(`
      SELECT 
        u.id,
        u.email,
        u.first_name,
        u.last_name,
        u.core_role,
        u.department,
        u.job_title,
        u.is_active,
        u.created_at,
        ma.app_name as microservice_name,
        ma.app_code as microservice_code,
        ur.role_name,
        ur.role_display_name,
        ur.role_level,
        STRING_AGG(p.permission_code, ', ') as permissions
      FROM app_users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id AND ur.is_active = 1
      LEFT JOIN microservice_apps ma ON ur.microservice_id = ma.id
      LEFT JOIN user_permissions up ON u.id = up.user_id AND up.is_active = 1
      LEFT JOIN permissions p ON up.permission_id = p.id
      WHERE u.is_active = 1
      GROUP BY u.id, u.email, u.first_name, u.last_name, u.core_role, u.department, u.job_title,
               u.is_active, u.created_at, ma.app_name, ma.app_code, ur.role_name, ur.role_display_name, ur.role_level
      ORDER BY u.email, ma.app_name, ur.role_level DESC
    `)
    return result
  } catch (error) {
    console.error("Error fetching users with roles and permissions:", error)
    return []
  }
}

export async function getAllDefinedRoles(microserviceCode: string = CURRENT_MICROSERVICE): Promise<any[]> {
  try {
    const roles = Object.entries(MICROSERVICE_ROLES).map(([key, roleName]) => {
      const roleLevel = roleName.includes("admin")
        ? 4
        : roleName.includes("director")
          ? 3
          : roleName.includes("liaison")
            ? 2
            : 1
      const roleDisplayName = roleName.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
      return {
        role_name: roleName,
        role_display_name: roleDisplayName,
        role_level: roleLevel,
        microservice_code: microserviceCode,
      }
    })
    return roles
  } catch (error) {
    console.error("Error fetching defined roles:", error)
    return []
  }
}

export async function getAllDefinedPermissions(microserviceCode: string = CURRENT_MICROSERVICE): Promise<Permission[]> {
  try {
    const result = await query<Permission>(
      `
      SELECT p.* 
      FROM permissions p
      INNER JOIN microservice_apps ma ON p.microservice_id = ma.id
      WHERE ma.app_code = @param0
      ORDER BY p.category, p.permission_name
    `,
      [microserviceCode],
    )
    return result
  } catch (error) {
    console.error("Error fetching defined permissions:", error)
    return []
  }
}

export async function updateUserRoles(
  userId: string,
  roleNames: string[],
  microserviceCode: string = CURRENT_MICROSERVICE,
  grantedBy: string,
): Promise<void> {
  const microservice = await query<{ id: string }>("SELECT id FROM microservice_apps WHERE app_code = @param0", [
    microserviceCode,
  ])
  if (microservice.length === 0) throw new Error(`Microservice ${microserviceCode} not found`)
  const microserviceId = microservice[0].id

  // Start a transaction
  const pool = await getDbConnection()
  const transaction = pool.transaction()
  await transaction.begin()

  try {
    // Deactivate all existing roles for this user in this microservice
    await transaction
      .request()
      .input("user_id", userId)
      .input("microservice_id", microserviceId)
      .query("UPDATE user_roles SET is_active = 0 WHERE user_id = @user_id AND microservice_id = @microservice_id")

    // Grant new roles
    for (const roleName of roleNames) {
      const roleConfig = Object.entries(MICROSERVICE_ROLES).find(([key, value]) => value === roleName)
      if (!roleConfig) {
        console.warn(`Role ${roleName} not found in MICROSERVICE_ROLES`)
        continue
      }

      const roleLevel = roleName.includes("admin")
        ? 4
        : roleName.includes("director")
          ? 3
          : roleName.includes("liaison")
            ? 2
            : 1
      const roleDisplayName = roleName.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())

      // Check if role assignment already exists but is inactive
      const existingRole = await transaction
        .request()
        .input("user_id", userId)
        .input("role_name", roleName)
        .input("microservice_id", microserviceId)
        .query(
          "SELECT id FROM user_roles WHERE user_id = @user_id AND role_name = @role_name AND microservice_id = @microservice_id",
        )

      if (existingRole.recordset.length > 0) {
        // Reactivate it
        await transaction
          .request()
          .input("id", existingRole.recordset[0].id)
          .input("granted_by", grantedBy)
          .query("UPDATE user_roles SET is_active = 1, granted_by = @granted_by, granted_at = GETDATE() WHERE id = @id")
      } else {
        // Insert new role assignment
        await transaction
          .request()
          .input("user_id", userId)
          .input("microservice_id", microserviceId)
          .input("role_name", roleName)
          .input("role_display_name", roleDisplayName)
          .input("role_level", roleLevel)
          .input("granted_by", grantedBy)
          .query(`INSERT INTO user_roles (user_id, microservice_id, role_name, role_display_name, role_level, granted_by, granted_at, is_active) 
                              VALUES (@user_id, @microservice_id, @role_name, @role_display_name, @role_level, @granted_by, GETDATE(), 1)`)
      }
    }
    await transaction.commit()
  } catch (error) {
    await transaction.rollback()
    console.error("Error updating user roles:", error)
    throw error
  }
}

// Legacy functions for backward compatibility - these bridge to the new app_users table
export async function createUser(userData: {
  clerk_user_id: string
  email: string
  first_name?: string
  last_name?: string
  role?: string
}): Promise<string> {
  try {
    const coreRole = determineCoreRole(userData.email)
    const userId = crypto.randomUUID()

    await query(
      `INSERT INTO app_users (id, clerk_user_id, email, first_name, last_name, core_role, is_active, created_at, updated_at)
       VALUES (@param0, @param1, @param2, @param3, @param4, @param5, 1, GETDATE(), GETDATE())`,
      [userId, userData.clerk_user_id, userData.email, userData.first_name || "", userData.last_name || "", coreRole],
    )

    // Assign default microservice roles
    await assignDefaultMicroserviceRoles(userId, userData.email, coreRole)

    return userId
  } catch (error) {
    console.error("Error creating user:", error)
    throw error
  }
}

export async function getUserByClerkId(clerkUserId: string): Promise<any | null> {
  try {
    const result = await query<AppUser>("SELECT * FROM app_users WHERE clerk_user_id = @param0", [clerkUserId])
    return result[0] || null
  } catch (error) {
    console.error("Error getting user by clerk ID:", error)
    return null
  }
}

export async function updateUserLastLogin(clerkUserId: string): Promise<void> {
  try {
    await query("UPDATE app_users SET updated_at = GETDATE() WHERE clerk_user_id = @param0", [clerkUserId])
  } catch (error) {
    console.error("Error updating user last login:", error)
  }
}

export async function getAllUsers(): Promise<any[]> {
  try {
    const result = await query("SELECT * FROM app_users ORDER BY created_at DESC")
    return result
  } catch (error) {
    console.error("Error getting all users:", error)
    return []
  }
}

export async function updateUserRole(userId: string, role: string): Promise<void> {
  try {
    await query("UPDATE app_users SET core_role = @param1, updated_at = GETDATE() WHERE id = @param0", [userId, role])
  } catch (error) {
    console.error("Error updating user role:", error)
    throw error
  }
}

export async function deactivateUser(userId: string): Promise<void> {
  try {
    await query("UPDATE app_users SET is_active = 0, updated_at = GETDATE() WHERE id = @param0", [userId])
  } catch (error) {
    console.error("Error deactivating user:", error)
    throw error
  }
}
