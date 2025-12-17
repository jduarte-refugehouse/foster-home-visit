import { NextRequest, NextResponse } from "next/server"
import { validateApiKey } from "@/lib/api-auth"
import { query } from "@refugehouse/shared-core/db"

export const dynamic = "force-dynamic"

// Default organization domains
const INTERNAL_DOMAINS = ["refugehouse.org"]

function isInternalUser(email: string): boolean {
  return INTERNAL_DOMAINS.some(domain => email.toLowerCase().endsWith(`@${domain}`))
}

function determineCoreRole(email: string): string {
  if (email === "jduarte@refugehouse.org") {
    return "system_admin"
  }
  if (isInternalUser(email)) {
    return "staff"
  }
  return "external"
}

/**
 * POST /api/radius/auth/user-create
 * 
 * Create a new user and assign default roles/permissions
 * Used by microservices that don't have direct database access
 * 
 * Request Body:
 * - clerkUserId: Clerk user ID (required)
 * - email: User email (required)
 * - firstName: First name (optional)
 * - lastName: Last name (optional)
 * - phone: Phone number (optional)
 * - microserviceCode: Microservice to assign roles for (optional, defaults to calling microservice)
 * 
 * Returns: { success: boolean, user?: AppUser, roles?: UserRole[], permissions?: Permission[] }
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now()
  console.log(`🔵 [RADIUS-API] /api/radius/auth/user-create endpoint called at ${new Date().toISOString()}`)

  try {
    // 1. Validate API key
    const apiKeyRaw = request.headers.get("x-api-key")
    const apiKey = apiKeyRaw?.trim() || null
    const validation = await validateApiKey(apiKey)

    if (!validation.valid) {
      console.warn(`🚫 [RADIUS-API] Invalid API key attempt: ${validation.error}`)
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
          details: validation.error || "Invalid API key",
        },
        { status: 401 }
      )
    }

    console.log(`✅ [RADIUS-API] Authenticated request from microservice: ${validation.key?.microservice_code}`)

    // 2. Parse request body
    const body = await request.json()
    const { clerkUserId, email, firstName, lastName, phone, microserviceCode } = body
    const targetMicroservice = microserviceCode || validation.key?.microservice_code

    if (!clerkUserId || !email) {
      return NextResponse.json(
        {
          success: false,
          error: "Bad Request",
          details: "clerkUserId and email are required",
        },
        { status: 400 }
      )
    }

    console.log(`👤 [RADIUS-API] Creating user: clerkUserId=${clerkUserId}, email=${email}, microservice=${targetMicroservice}`)

    // 3. Check if user already exists
    const existingUser = await query<any>(
      `SELECT id, clerk_user_id, email FROM app_users WHERE clerk_user_id = @param0 OR email = @param1`,
      [clerkUserId, email]
    )

    let userId: string

    if (existingUser.length > 0) {
      // User exists - update if needed
      const existingRecord = existingUser[0]
      
      // Update the existing record
      await query(
        `UPDATE app_users 
         SET clerk_user_id = @param0, 
             email = @param1, 
             first_name = COALESCE(@param2, first_name),
             last_name = COALESCE(@param3, last_name),
             phone = COALESCE(@param4, phone),
             updated_at = GETDATE()
         WHERE id = @param5`,
        [clerkUserId, email, firstName || null, lastName || null, phone || null, existingRecord.id]
      )
      
      userId = existingRecord.id
      console.log(`📝 [RADIUS-API] Updated existing user: ${email} (${userId})`)
    } else {
      // Create new user
      const coreRole = determineCoreRole(email)

      const newUserResult = await query<{ id: string }>(
        `INSERT INTO app_users (clerk_user_id, email, first_name, last_name, phone, core_role, is_active, created_at, updated_at)
         OUTPUT INSERTED.id
         VALUES (@param0, @param1, @param2, @param3, @param4, @param5, 1, GETDATE(), GETDATE())`,
        [clerkUserId, email, firstName || "", lastName || "", phone || null, coreRole]
      )

      userId = newUserResult[0].id
      console.log(`🆕 [RADIUS-API] Created new user: ${email} (${userId}) with core_role=${coreRole}`)

      // Assign default roles for the microservice
      if (targetMicroservice) {
        await assignDefaultMicroserviceRoles(userId, email, coreRole, targetMicroservice)
      }
    }

    // 4. Fetch the complete user with roles and permissions
    const user = await query<any>(
      `SELECT 
        id, clerk_user_id, email, first_name, last_name, phone,
        is_active, core_role, department, job_title,
        user_type, environment, created_at, updated_at
      FROM app_users 
      WHERE id = @param0`,
      [userId]
    )

    // Get roles
    let roles: any[] = []
    if (targetMicroservice) {
      roles = await query<any>(
        `SELECT 
          ur.id, ur.user_id, ur.microservice_id, ur.role_name,
          ur.granted_by, ur.granted_at, ur.is_active,
          ma.app_code as microservice_code, ma.app_name as microservice_name
        FROM user_roles ur
        INNER JOIN microservice_apps ma ON ur.microservice_id = ma.id
        WHERE ur.user_id = @param0 AND ma.app_code = @param1 AND ur.is_active = 1
        ORDER BY ur.granted_at ASC`,
        [userId, targetMicroservice]
      )

      // Add computed fields
      roles = roles.map((role: any) => ({
        ...role,
        role_display_name: role.role_name.replace(/_/g, " ").replace(/\b\w/g, (l: string) => l.toUpperCase()),
        role_level: role.role_name.includes("admin") || role.role_name === "global_admin"
          ? 4
          : role.role_name.includes("director")
            ? 3
            : role.role_name.includes("liaison") || role.role_name.includes("coordinator") || role.role_name.includes("manager")
              ? 2
              : 1
      }))
    }

    // Get permissions
    let permissions: any[] = []
    if (targetMicroservice) {
      permissions = await query<any>(
        `SELECT DISTINCT 
          p.id, p.microservice_id, p.permission_code, p.permission_name,
          p.description, p.category,
          ma.app_code as microservice_code, ma.app_name as microservice_name
        FROM user_permissions up
        INNER JOIN permissions p ON up.permission_id = p.id
        INNER JOIN microservice_apps ma ON p.microservice_id = ma.id
        WHERE up.user_id = @param0 AND ma.app_code = @param1 
        AND up.is_active = 1 AND (up.expires_at IS NULL OR up.expires_at > GETDATE())
        ORDER BY p.category, p.permission_name`,
        [userId, targetMicroservice]
      )
    }

    const duration = Date.now() - startTime
    console.log(`✅ [RADIUS-API] User created/updated: ${email}, ${roles.length} roles, ${permissions.length} permissions in ${duration}ms`)

    return NextResponse.json({
      success: true,
      user: user[0],
      roles,
      permissions,
      isNewUser: existingUser.length === 0,
      timestamp: new Date().toISOString(),
      duration_ms: duration,
    })
  } catch (error) {
    const duration = Date.now() - startTime
    console.error("❌ [RADIUS-API] Error in user-create endpoint:", error)

    return NextResponse.json(
      {
        success: false,
        user: null,
        roles: [],
        permissions: [],
        error: error instanceof Error ? error.message : "Unknown error occurred",
        timestamp: new Date().toISOString(),
        duration_ms: duration,
      },
      { status: 500 }
    )
  }
}

/**
 * Assign default microservice roles based on email and core role
 */
async function assignDefaultMicroserviceRoles(
  userId: string,
  email: string,
  coreRole: string,
  microserviceCode: string
): Promise<void> {
  try {
    // Get microservice ID
    const microservice = await query<{ id: string }>(
      "SELECT id FROM microservice_apps WHERE app_code = @param0",
      [microserviceCode]
    )

    if (microservice.length === 0) {
      console.error(`❌ [RADIUS-API] Microservice ${microserviceCode} not found in database`)
      return
    }

    const microserviceId = microservice[0].id

    // Define role assignment based on email and core role
    let roleName: string | null = null

    // Specific user role assignments (Refuge House specific)
    if (email === "jduarte@refugehouse.org") {
      roleName = "qa_director"
    } else if (email === "mgorman@refugehouse.org") {
      roleName = "scheduling_admin"
    } else if (email === "ggroman@refugehouse.org") {
      roleName = "home_visit_liaison"
    } else if (email === "hsartin@refugehouse.org") {
      roleName = "case_manager"
    } else if (email === "smathis@refugehouse.org") {
      roleName = "qa_director"
    } else if (coreRole === "staff") {
      roleName = "viewer"
    } else if (coreRole === "external") {
      roleName = "foster_parent"
    }

    if (roleName) {
      // Check if role assignment already exists
      const existingRole = await query<{ id: string }>(
        `SELECT id FROM user_roles 
         WHERE user_id = @param0 AND microservice_id = @param1 AND role_name = @param2`,
        [userId, microserviceId, roleName]
      )

      if (existingRole.length === 0) {
        // Insert new role
        await query(
          `INSERT INTO user_roles (user_id, microservice_id, role_name, granted_by, granted_at, is_active)
           VALUES (@param0, @param1, @param2, 'system', GETDATE(), 1)`,
          [userId, microserviceId, roleName]
        )
        console.log(`✅ [RADIUS-API] Assigned role '${roleName}' to user ${email} for ${microserviceCode}`)
      } else {
        // Activate existing role if inactive
        await query(
          `UPDATE user_roles SET is_active = 1, granted_at = GETDATE() WHERE id = @param0`,
          [existingRole[0].id]
        )
        console.log(`✅ [RADIUS-API] Reactivated role '${roleName}' for user ${email} in ${microserviceCode}`)
      }
    }
  } catch (error) {
    console.error("❌ [RADIUS-API] Error assigning default microservice roles:", error)
    // Don't throw - role assignment failure shouldn't fail user creation
  }
}

