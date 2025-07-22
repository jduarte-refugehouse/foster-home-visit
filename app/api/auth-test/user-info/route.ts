import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    const { clerkUserId, email, firstName, lastName } = await request.json()

    if (!clerkUserId || !email) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Check if user already exists
    const existingUser = await query<{
      id: string
      clerk_user_id: string
      email: string
      first_name: string
      last_name: string
      is_active: boolean
      created_at: Date
      updated_at: Date
    }>("SELECT * FROM app_users WHERE clerk_user_id = @param0", [clerkUserId])

    let appUser
    if (existingUser.length > 0) {
      // Update existing user
      await query(
        `UPDATE app_users 
         SET email = @param1, first_name = @param2, last_name = @param3, updated_at = GETDATE()
         WHERE clerk_user_id = @param0`,
        [clerkUserId, email, firstName || "", lastName || ""],
      )
      appUser = existingUser[0]
    } else {
      // Create new user
      const newUserResult = await query<{ id: string }>(
        `INSERT INTO app_users (clerk_user_id, email, first_name, last_name, is_active, created_at, updated_at)
         OUTPUT INSERTED.id
         VALUES (@param0, @param1, @param2, @param3, 1, GETDATE(), GETDATE())`,
        [clerkUserId, email, firstName || "", lastName || ""],
      )

      const userId = newUserResult[0].id

      // Assign default roles based on email domain
      await assignDefaultRoles(userId, email)

      // Get the created user
      const createdUser = await query<{
        id: string
        clerk_user_id: string
        email: string
        first_name: string
        last_name: string
        is_active: boolean
        created_at: Date
        updated_at: Date
      }>("SELECT * FROM app_users WHERE id = @param0", [userId])
      appUser = createdUser[0]
    }

    // Get user roles and permissions
    const userRoles = await query<{ role_name: string; app_name: string }>(
      `SELECT ur.role_name, ma.app_name
       FROM user_roles ur
       INNER JOIN microservice_apps ma ON ur.microservice_id = ma.id
       WHERE ur.user_id = @param0 AND ur.is_active = 1`,
      [appUser.id],
    )

    const userPermissions = await query<{ permission_code: string; permission_name: string; app_name: string }>(
      `SELECT p.permission_code, p.permission_name, ma.app_name
       FROM user_permissions up
       INNER JOIN permissions p ON up.permission_id = p.id
       INNER JOIN microservice_apps ma ON p.microservice_id = ma.id
       WHERE up.user_id = @param0 AND up.is_active = 1 
       AND (up.expires_at IS NULL OR up.expires_at > GETDATE())`,
      [appUser.id],
    )

    return NextResponse.json({
      appUser,
      roles: userRoles,
      permissions: userPermissions,
    })
  } catch (error) {
    console.error("Error in auth-test user-info:", error)
    return NextResponse.json(
      {
        error: "Failed to process user information",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

async function assignDefaultRoles(userId: string, email: string): Promise<void> {
  try {
    // Get home-visits microservice ID
    const microservice = await query<{ id: string }>("SELECT id FROM microservice_apps WHERE app_code = @param0", [
      "home-visits",
    ])

    if (microservice.length === 0) {
      console.error("home-visits microservice not found in database")
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
