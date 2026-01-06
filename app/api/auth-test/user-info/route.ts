import { type NextRequest, NextResponse } from "next/server"
import { query } from "@refugehouse/shared-core/db"
import { checkUserAccess } from "@refugehouse/shared-core/user-access"
import { getMicroserviceCode, shouldUseRadiusApiClient } from "@/lib/microservice-config"
import { radiusApiClient } from "@refugehouse/radius-api-client"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"
export const maxDuration = 60 // Increase timeout to 60 seconds

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    const { clerkUserId, email, firstName, lastName } = await request.json()

    if (!clerkUserId || !email) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    console.log(`🔍 [AUTH-TEST] Starting user-info request for ${email} (${Date.now() - startTime}ms)`)

    const microserviceCode = getMicroserviceCode()
    const useApiClient = shouldUseRadiusApiClient()

    console.log(`🔍 [AUTH-TEST] Config: useApiClient=${useApiClient}, microserviceCode=${microserviceCode} (${Date.now() - startTime}ms)`)

    // Check user access (this will send email notification if new external user without access)
    let accessCheck: {
      hasAccess: boolean
      requiresInvitation: boolean
      isNewUser: boolean
      userExists: boolean
      hasInvitation: boolean
    }

    if (useApiClient) {
      // Use API client for non-admin microservices
      try {
        console.log(`🔍 [AUTH-TEST] Calling checkUserAccess via API Hub (${Date.now() - startTime}ms)`)
        const result = await radiusApiClient.checkUserAccess({
          clerkUserId,
          email,
          firstName,
          lastName,
        })
        console.log(`✅ [AUTH-TEST] checkUserAccess completed (${Date.now() - startTime}ms)`)
        accessCheck = {
          hasAccess: result.hasAccess,
          requiresInvitation: result.requiresInvitation,
          isNewUser: result.isNewUser,
          userExists: result.userExists,
          hasInvitation: result.hasInvitation,
        }
      } catch (apiError) {
        console.error(`❌ [AUTH-TEST] Error checking access via API Hub (${Date.now() - startTime}ms):`, apiError)
        return NextResponse.json(
          {
            error: "Failed to check user access",
            details: apiError instanceof Error ? apiError.message : "Unknown error",
            elapsed_ms: Date.now() - startTime,
          },
          { status: 500 }
        )
      }
    } else {
      // Admin microservice: use direct DB access
      console.log(`🔍 [AUTH-TEST] Calling checkUserAccess via direct DB (${Date.now() - startTime}ms)`)
      accessCheck = await checkUserAccess(clerkUserId, email, firstName, lastName)
      console.log(`✅ [AUTH-TEST] checkUserAccess completed (${Date.now() - startTime}ms)`)
    }

    if (!accessCheck.hasAccess) {
      return NextResponse.json(
        {
          error: "Access denied. External users require an invitation to join.",
          requiresInvitation: true,
          isNewUser: accessCheck.isNewUser,
          elapsed_ms: Date.now() - startTime,
        },
        { status: 403 },
      )
    }

    let appUser
    let userRoles: Array<{ role_name: string; app_name: string }> = []
    let userPermissions: Array<{ permission_code: string; permission_name: string; app_name: string }> = []

    if (useApiClient) {
      // Use Radius API client for non-admin microservices
      try {
        console.log(`🔍 [AUTH-TEST] Getting/creating user via API Hub (${Date.now() - startTime}ms):`, { clerkUserId, email, microserviceCode })
        const userResult = await radiusApiClient.getOrCreateUser({
          clerkUserId,
          email,
          firstName: firstName || undefined,
          lastName: lastName || undefined,
          microserviceCode: microserviceCode,
        })
        console.log(`✅ [AUTH-TEST] getOrCreateUser completed (${Date.now() - startTime}ms)`)
        console.log("📥 [AUTH-TEST] API Hub response:", JSON.stringify({ 
          found: (userResult as any).found ?? undefined,
          isNewUser: (userResult as any).isNewUser ?? undefined,
          userId: userResult.user?.id,
          hasRoles: userResult.roles?.length > 0,
          hasPermissions: userResult.permissions?.length > 0,
        }, null, 2))

        if (!userResult.user) {
          return NextResponse.json({ 
            error: "Failed to create or retrieve user",
            elapsed_ms: Date.now() - startTime,
          }, { status: 500 })
        }

      // API returns snake_case, map to expected format
      appUser = {
        id: userResult.user.id,
        clerk_user_id: userResult.user.clerk_user_id,
        email: userResult.user.email,
        first_name: userResult.user.first_name || "",
        last_name: userResult.user.last_name || "",
        is_active: userResult.user.is_active ?? true,
        created_at: userResult.user.created_at ? new Date(userResult.user.created_at) : new Date(),
        updated_at: userResult.user.updated_at ? new Date(userResult.user.updated_at) : new Date(),
      }

      // Map roles and permissions from API response (API returns snake_case)
      userRoles = (userResult.roles || []).map((r: any) => ({
        role_name: r.role_name,
        app_name: r.microservice_name || microserviceCode || "home-visits",
      }))

      userPermissions = (userResult.permissions || []).map((p: any) => ({
        permission_code: p.permission_code,
        permission_name: p.permission_name || p.permission_code,
        app_name: p.microservice_name || microserviceCode || "home-visits",
      }))
      } catch (apiError) {
        console.error(`❌ [AUTH-TEST] Error getting/creating user via API Hub (${Date.now() - startTime}ms):`, apiError)
        console.error("❌ [AUTH-TEST] Error details:", {
          message: apiError instanceof Error ? apiError.message : String(apiError),
          stack: apiError instanceof Error ? apiError.stack : undefined,
        })
        return NextResponse.json(
          {
            error: "Failed to get or create user",
            details: apiError instanceof Error ? apiError.message : "Unknown error",
            elapsed_ms: Date.now() - startTime,
          },
          { status: 500 }
        )
      }
    } else {
      // Direct database access for admin microservice
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
      }>("SELECT * FROM app_users WHERE clerk_user_id = @param0 OR email = @param1", [clerkUserId, email])

      if (existingUser.length > 0) {
        // Update existing user
        await query(
          `UPDATE app_users 
           SET email = @param1, first_name = @param2, last_name = @param3, updated_at = GETDATE()
           WHERE clerk_user_id = @param0 OR email = @param1`,
          [clerkUserId, email, firstName || "", lastName || ""],
        )
        appUser = existingUser[0]
      } else {
        // User has access (via invitation or refugehouse.org), create new user

        // Create new user
        const newUserResult = await query<{ id: string }>(
          `INSERT INTO app_users (clerk_user_id, email, first_name, last_name, is_active, created_at, updated_at)
           OUTPUT INSERTED.id
           VALUES (@param0, @param1, @param2, @param3, 1, GETDATE(), GETDATE())`,
          [clerkUserId, email, firstName || "", lastName || ""],
        )

        const userId = newUserResult[0].id

        // Assign roles and permissions based on email and specific user rules
        await assignUserRolesAndPermissions(userId, email)

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
      userRoles = await query<{ role_name: string; app_name: string }>(
        `SELECT ur.role_name, ma.app_name
         FROM user_roles ur
         INNER JOIN microservice_apps ma ON ur.microservice_id = ma.id
         WHERE ur.user_id = @param0 AND ur.is_active = 1`,
        [appUser.id],
      )

      userPermissions = await query<{ permission_code: string; permission_name: string; app_name: string }>(
        `SELECT p.permission_code, p.permission_name, ma.app_name
         FROM user_permissions up
         INNER JOIN permissions p ON up.permission_id = p.id
         INNER JOIN microservice_apps ma ON p.microservice_id = ma.id
         WHERE up.user_id = @param0 AND up.is_active = 1 
         AND (up.expires_at IS NULL OR up.expires_at > GETDATE())`,
        [appUser.id],
      )
    }

    const elapsed = Date.now() - startTime
    console.log(`✅ [AUTH-TEST] Request completed successfully in ${elapsed}ms`)

    return NextResponse.json({
      appUser,
      roles: userRoles,
      permissions: userPermissions,
      elapsed_ms: elapsed,
    })
  } catch (error) {
    const elapsed = Date.now() - startTime
    console.error(`❌ [AUTH-TEST] Error in user-info (${elapsed}ms):`, error)
    return NextResponse.json(
      {
        error: "Failed to process user information",
        details: error instanceof Error ? error.message : "Unknown error",
        elapsed_ms: elapsed,
      },
      { status: 500 },
    )
  }
}

async function assignUserRolesAndPermissions(userId: string, email: string): Promise<void> {
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

    if (email === "jduarte@refugehouse.org") {
      // Global admin - gets admin role and all permissions
      await query(
        `INSERT INTO user_roles (user_id, microservice_id, role_name, granted_by, granted_at, is_active)
         VALUES (@param0, @param1, 'global_admin', 'system', GETDATE(), 1)`,
        [userId, microserviceId],
      )

      // Assign all permissions for this microservice
      const allPermissions = await query<{ id: string }>("SELECT id FROM permissions WHERE microservice_id = @param0", [
        microserviceId,
      ])

      for (const permission of allPermissions) {
        await query(
          `INSERT INTO user_permissions (user_id, permission_id, granted_by, granted_at, is_active)
           VALUES (@param0, @param1, 'system', GETDATE(), 1)`,
          [userId, permission.id],
        )
      }
    } else if (email.endsWith("@refugehouse.org")) {
      // Regular refugehouse.org users - get staff role with view_homes permission only
      await query(
        `INSERT INTO user_roles (user_id, microservice_id, role_name, granted_by, granted_at, is_active)
         VALUES (@param0, @param1, 'staff', 'system', GETDATE(), 1)`,
        [userId, microserviceId],
      )

      // Assign only view_homes permission
      const viewHomesPermission = await query<{ id: string }>(
        `SELECT id FROM permissions 
         WHERE microservice_id = @param0 AND permission_code = 'view_homes'`,
        [microserviceId],
      )

      if (viewHomesPermission.length > 0) {
        await query(
          `INSERT INTO user_permissions (user_id, permission_id, granted_by, granted_at, is_active)
           VALUES (@param0, @param1, 'system', GETDATE(), 1)`,
          [userId, viewHomesPermission[0].id],
        )
      }
    } else {
      // External users (with invitation) - get foster_parent role but NO permissions initially
      await query(
        `INSERT INTO user_roles (user_id, microservice_id, role_name, granted_by, granted_at, is_active)
         VALUES (@param0, @param1, 'foster_parent', 'system', GETDATE(), 1)`,
        [userId, microserviceId],
      )

      // No permissions assigned - they must be granted manually by an admin
      console.log(`External user ${email} created with foster_parent role but no permissions`)
    }
  } catch (error) {
    console.error("Error assigning user roles and permissions:", error)
  }
}
