import { query, getDbConnection } from "./db"
import { currentUser } from "@clerk/nextjs/server"
import crypto from "crypto"

// Define the current microservice
export const CURRENT_MICROSERVICE = "home-visits"

export interface AppUser {
  id: string
  clerk_user_id: string
  email: string
  first_name: string
  last_name: string
  is_active: boolean
  created_at: Date
  updated_at: Date
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
  granted_by: string
  granted_at: Date
  is_active: boolean
}

export interface Permission {
  id: string
  microservice_id: string
  permission_code: string
  permission_name: string
  description: string
  category: string
}

export interface UserPermission {
  id: string
  user_id: string
  permission_id: string
  granted_by: string
  granted_at: Date
  expires_at?: Date
  is_active: boolean
}

export interface User {
  id: string
  clerk_user_id: string
  email: string
  first_name?: string
  last_name?: string
  role: "admin" | "user" | "supervisor"
  status: "active" | "inactive" | "pending"
  created_at: Date
  updated_at: Date
  last_login?: Date
}

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

export async function getUserRolesForMicroservice(userId: string, microserviceCode: string): Promise<string[]> {
  try {
    const result = await query<{ role_name: string }>(
      `SELECT ur.role_name 
       FROM user_roles ur
       INNER JOIN microservice_apps ma ON ur.microservice_id = ma.id
       WHERE ur.user_id = @param0 AND ma.app_code = @param1 AND ur.is_active = 1`,
      [userId, microserviceCode],
    )
    return result.map((r) => r.role_name)
  } catch (error) {
    console.error("Error fetching user roles:", error)
    return []
  }
}

export async function getUserPermissionsForMicroservice(userId: string, microserviceCode: string): Promise<string[]> {
  try {
    const result = await query<{ permission_code: string }>(
      `SELECT p.permission_code
       FROM user_permissions up
       INNER JOIN permissions p ON up.permission_id = p.id
       INNER JOIN microservice_apps ma ON p.microservice_id = ma.id
       WHERE up.user_id = @param0 AND ma.app_code = @param1 
       AND up.is_active = 1 AND (up.expires_at IS NULL OR up.expires_at > GETDATE())`,
      [userId, microserviceCode],
    )
    return result.map((r) => r.permission_code)
  } catch (error) {
    console.error("Error fetching user permissions:", error)
    return []
  }
}

export async function hasPermission(
  userId: string,
  permissionCode: string,
  microserviceCode: string = CURRENT_MICROSERVICE,
): Promise<boolean> {
  const permissions = await getUserPermissionsForMicroservice(userId, microserviceCode)
  return permissions.includes(permissionCode)
}

export async function hasRole(
  userId: string,
  roleName: string,
  microserviceCode: string = CURRENT_MICROSERVICE,
): Promise<boolean> {
  const roles = await getUserRolesForMicroservice(userId, microserviceCode)
  return roles.includes(roleName)
}

export async function isUserAdmin(userId: string): Promise<boolean> {
  // Check if user has admin role in ANY microservice or is refugehouse.org user
  try {
    const user = await query<AppUser>("SELECT email FROM app_users WHERE id = @param0", [userId])
    if (user[0]?.email?.endsWith("@refugehouse.org")) {
      return true
    }

    const adminRoles = await query<{ count: number }>(
      `SELECT COUNT(*) as count FROM user_roles 
       WHERE user_id = @param0 AND role_name = 'admin' AND is_active = 1`,
      [userId],
    )
    return adminRoles[0]?.count > 0
  } catch (error) {
    console.error("Error checking admin status:", error)
    return false
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
      // Create new user
      const newUserResult = await query<{ id: string }>(
        `INSERT INTO app_users (clerk_user_id, email, first_name, last_name, is_active, created_at, updated_at)
         OUTPUT INSERTED.id
         VALUES (@param0, @param1, @param2, @param3, 1, GETDATE(), GETDATE())`,
        [clerkUser.id, email, firstName, lastName],
      )
      userId = newUserResult[0].id

      // Assign default roles based on email domain
      await assignDefaultRoles(userId, email)
    }

    // Return the updated/created user
    const result = await query<AppUser>("SELECT * FROM app_users WHERE clerk_user_id = @param0", [clerkUser.id])
    return result[0]
  } catch (error) {
    console.error("Error creating/updating app user:", error)
    throw error
  }
}

async function assignDefaultRoles(userId: string, email: string): Promise<void> {
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

    // Assign roles based on email domain
    if (email.endsWith("@refugehouse.org")) {
      // Internal users get admin role
      await query(
        `INSERT INTO user_roles (user_id, microservice_id, role_name, granted_by, granted_at, is_active)
         VALUES (@param0, @param1, 'admin', 'system', GETDATE(), 1)`,
        [userId, microserviceId],
      )

      // Also assign all permissions for this microservice
      const permissions = await query<{ id: string }>("SELECT id FROM permissions WHERE microservice_id = @param0", [
        microserviceId,
      ])

      for (const permission of permissions) {
        await query(
          `INSERT INTO user_permissions (user_id, permission_id, granted_by, granted_at, is_active)
           VALUES (@param0, @param1, 'system', GETDATE(), 1)`,
          [userId, permission.id],
        )
      }
    } else {
      // External users get foster_parent role
      await query(
        `INSERT INTO user_roles (user_id, microservice_id, role_name, granted_by, granted_at, is_active)
         VALUES (@param0, @param1, 'foster_parent', 'system', GETDATE(), 1)`,
        [userId, microserviceId],
      )

      // Assign basic permissions for foster parents
      const basicPermissions = await query<{ id: string }>(
        `SELECT id FROM permissions 
         WHERE microservice_id = @param0 AND permission_code IN ('view_homes', 'view_dashboard')`,
        [microserviceId],
      )

      for (const permission of basicPermissions) {
        await query(
          `INSERT INTO user_permissions (user_id, permission_id, granted_by, granted_at, is_active)
           VALUES (@param0, @param1, 'system', GETDATE(), 1)`,
          [userId, permission.id],
        )
      }
    }
  } catch (error) {
    console.error("Error assigning default roles:", error)
  }
}

export async function isUserAuthorized(email: string): Promise<boolean> {
  // Internal users (refugehouse.org) are always authorized
  if (email.endsWith("@refugehouse.org")) {
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
        u.is_active,
        u.created_at,
        ma.app_name as microservice_name,
        ma.app_code as microservice_code,
        ur.role_name,
        STRING_AGG(p.permission_code, ', ') as permissions
      FROM app_users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id AND ur.is_active = 1
      LEFT JOIN microservice_apps ma ON ur.microservice_id = ma.id
      LEFT JOIN user_permissions up ON u.id = up.user_id AND up.is_active = 1
      LEFT JOIN permissions p ON up.permission_id = p.id
      WHERE u.is_active = 1
      GROUP BY u.id, u.email, u.first_name, u.last_name, u.is_active, u.created_at, 
               ma.app_name, ma.app_code, ur.role_name
      ORDER BY u.email, ma.app_name
    `)
    return result
  } catch (error) {
    console.error("Error fetching users with roles and permissions:", error)
    return []
  }
}

export async function createUser(userData: {
  clerk_user_id: string
  email: string
  first_name?: string
  last_name?: string
  role?: string
}): Promise<string> {
  const pool = await getDbConnection()

  const userId = crypto.randomUUID()

  await pool
    .request()
    .input("id", userId)
    .input("clerk_user_id", userData.clerk_user_id)
    .input("email", userData.email)
    .input("first_name", userData.first_name || null)
    .input("last_name", userData.last_name || null)
    .input("role", userData.role || "user")
    .input("status", "active")
    .query(`
      INSERT INTO users (id, clerk_user_id, email, first_name, last_name, role, status, created_at, updated_at)
      VALUES (@id, @clerk_user_id, @email, @first_name, @last_name, @role, @status, GETDATE(), GETDATE())
    `)

  return userId
}

export async function getUserByClerkId(clerkUserId: string): Promise<User | null> {
  const pool = await getDbConnection()

  const result = await pool
    .request()
    .input("clerk_user_id", clerkUserId)
    .query("SELECT * FROM users WHERE clerk_user_id = @clerk_user_id")

  return result.recordset[0] || null
}

export async function updateUserLastLogin(clerkUserId: string): Promise<void> {
  const pool = await getDbConnection()

  await pool
    .request()
    .input("clerk_user_id", clerkUserId)
    .query("UPDATE users SET last_login = GETDATE(), updated_at = GETDATE() WHERE clerk_user_id = @clerk_user_id")
}

export async function getAllUsers(): Promise<User[]> {
  const pool = await getDbConnection()

  const result = await pool.request().query("SELECT * FROM users ORDER BY created_at DESC")

  return result.recordset
}

export async function updateUserRole(userId: string, role: string): Promise<void> {
  const pool = await getDbConnection()

  await pool
    .request()
    .input("id", userId)
    .input("role", role)
    .query("UPDATE users SET role = @role, updated_at = GETDATE() WHERE id = @id")
}

export async function deactivateUser(userId: string): Promise<void> {
  const pool = await getDbConnection()

  await pool
    .request()
    .input("id", userId)
    .query("UPDATE users SET status = 'inactive', updated_at = GETDATE() WHERE id = @id")
}
