import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    const { clerkUserId, email, firstName, lastName } = await request.json()

    if (!clerkUserId || !email) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    console.log(`🔐 [Auth Test] Processing user: ${email}`)

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
    const isRefugeHouse = email.endsWith("@refugehouse.org")
    const isGlobalAdmin = email === "jduarte@refugehouse.org"

    if (existingUser.length > 0) {
      // Update existing user
      await query(
        `UPDATE app_users 
         SET email = @param0, first_name = @param1, last_name = @param2, updated_at = GETDATE()
         WHERE clerk_user_id = @param3`,
        [email, firstName || "", lastName || "", clerkUserId],
      )
      appUser = existingUser[0]
      console.log(`✅ [Auth Test] Updated existing user: ${email}`)
    } else {
      // Check if non-refugehouse user has invitation
      if (!isRefugeHouse) {
        const invitation = await query<{ id: string }>(
          "SELECT id FROM invited_users WHERE email = @param0 AND is_active = 1",
          [email],
        )

        if (invitation.length === 0) {
          return NextResponse.json(
            {
              error: "Access denied. External users require an invitation.",
              requiresInvitation: true,
            },
            { status: 403 },
          )
        }
      }

      // Create new user
      const newUserResult = await query<{ id: string }>(
        `INSERT INTO app_users (clerk_user_id, email, first_name, last_name, is_active, created_at, updated_at)
         OUTPUT INSERTED.id
         VALUES (@param0, @param1, @param2, @param3, 1, GETDATE(), GETDATE())`,
        [clerkUserId, email, firstName || "", lastName || ""],
      )

      const userId = newUserResult[0].id

      appUser = {
        id: userId,
        clerk_user_id: clerkUserId,
        email,
        first_name: firstName,
        last_name: lastName,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      }

      console.log(`✅ [Auth Test] Created new user: ${email}`)

      // Get microservice ID
      const microservice = await query<{ id: string }>("SELECT id FROM microservice_apps WHERE app_code = @param0", [
        "home-visits",
      ])

      if (microservice.length === 0) {
        throw new Error("Home-visits microservice not found")
      }

      const microserviceId = microservice[0].id

      // Assign role and permissions based on user type
      let roleName = "foster_parent"
      let permissions: string[] = []

      if (isGlobalAdmin) {
        roleName = "global_admin"
        permissions = ["view_dashboard", "view_homes", "edit_homes", "view_diagnostics", "manage_users", "system_admin"]
      } else if (isRefugeHouse) {
        roleName = "staff"
        permissions = ["view_homes"]
      }
      // External users get foster_parent role but no permissions initially

      // Insert role
      await query(
        `INSERT INTO user_roles (user_id, microservice_id, role_name, granted_by)
         VALUES (@param0, @param1, @param2, @param3)`,
        [userId, microserviceId, roleName, "system"],
      )

      // Insert permissions
      for (const permissionCode of permissions) {
        const permission = await query<{ id: string }>(
          "SELECT id FROM permissions WHERE microservice_id = @param0 AND permission_code = @param1",
          [microserviceId, permissionCode],
        )

        if (permission.length > 0) {
          await query(
            `INSERT INTO user_permissions (user_id, permission_id, granted_by)
             VALUES (@param0, @param1, @param2)`,
            [userId, permission[0].id, "system"],
          )
        }
      }
    }

    // Get user roles and permissions
    const userRoles = await query<{
      role_name: string
      app_name: string
    }>(
      `SELECT ur.role_name, ma.app_name
       FROM user_roles ur
       INNER JOIN microservice_apps ma ON ur.microservice_id = ma.id
       WHERE ur.user_id = @param0 AND ur.is_active = 1`,
      [appUser.id],
    )

    const userPermissions = await query<{
      permission_code: string
      permission_name: string
      description: string
      app_name: string
    }>(
      `SELECT p.permission_code, p.permission_name, p.description, ma.app_name
       FROM user_permissions up
       INNER JOIN permissions p ON up.permission_id = p.id
       INNER JOIN microservice_apps ma ON p.microservice_id = ma.id
       WHERE up.user_id = @param0 AND up.is_active = 1`,
      [appUser.id],
    )

    return NextResponse.json({
      success: true,
      appUser,
      roles: userRoles,
      permissions: userPermissions,
      userType: isGlobalAdmin ? "Global Admin" : isRefugeHouse ? "Staff" : "External User",
    })
  } catch (error) {
    console.error("❌ [Auth Test] Database error:", error)
    return NextResponse.json(
      {
        error: "Database connection failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
