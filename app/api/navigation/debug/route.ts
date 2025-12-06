import { type NextRequest, NextResponse } from "next/server"
import { getConnection } from "@refugehouse/shared-core/db"
import { MICROSERVICE_CONFIG } from "@/lib/microservice-config"
import { requireClerkAuth } from "@refugehouse/shared-core/auth"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  console.log("🔍 Navigation Debug API called")

  try {
    // Get credentials from headers (stored after initial Clerk authentication)
    // NO CLERK API CALLS - only use stored credentials
    const auth = requireClerkAuth(request)
    console.log("👤 Auth from headers:", { clerkUserId: auth.clerkUserId, email: auth.email, name: auth.name })

    const connection = await getConnection()

    // Get app user record
    const userQuery = `
      SELECT id, clerk_user_id, email, first_name, last_name, is_active, created_at, updated_at
      FROM app_users 
      WHERE clerk_user_id = @param0
    `
    const userResult = await connection.request().input("param0", auth.clerkUserId).query(userQuery)
    const appUser = userResult.recordset[0] || null

    // Get microservice info
    const microserviceQuery = `
      SELECT id, app_code, app_name, app_url, description, is_active, created_at
      FROM microservice_apps 
      WHERE app_code = @param0 AND is_active = 1
    `
    const microserviceResult = await connection
      .request()
      .input("param0", MICROSERVICE_CONFIG.code)
      .query(microserviceQuery)
    const microservice = microserviceResult.recordset[0] || null

    // Get all permissions for this microservice
    const permissionsQuery = `
      SELECT 
        p.id,
        p.microservice_id,
        p.permission_code,
        p.permission_name,
        p.description,
        p.category,
        p.created_at,
        ma.app_code
      FROM permissions p
      INNER JOIN microservice_apps ma ON p.microservice_id = ma.id
      WHERE ma.app_code = @param0
      ORDER BY p.category, p.permission_code
    `
    const permissionsResult = await connection
      .request()
      .input("param0", MICROSERVICE_CONFIG.code)
      .query(permissionsQuery)
    const permissionsInTable = permissionsResult.recordset

    // Get user permissions
    let userPermissions = []
    let userPermissionsCount = { total: 0 }
    let allUserPermissions = []

    if (appUser && microservice) {
      const userPermissionsQuery = `
        SELECT 
          up.id,
          up.user_id,
          up.permission_id,
          up.granted_at,
          up.expires_at,
          up.is_active,
          p.permission_code,
          p.permission_name,
          p.description,
          au.email,
          au.first_name,
          au.last_name
        FROM user_permissions up
        INNER JOIN permissions p ON up.permission_id = p.id
        INNER JOIN app_users au ON up.user_id = au.id
        INNER JOIN microservice_apps ma ON p.microservice_id = ma.id
        WHERE up.user_id = @param0 
          AND ma.app_code = @param1 
          AND up.is_active = 1 
          AND (up.expires_at IS NULL OR up.expires_at > GETDATE())
        ORDER BY p.permission_code
      `
      const userPermissionsResult = await connection
        .request()
        .input("param0", appUser.id)
        .input("param1", MICROSERVICE_CONFIG.code)
        .query(userPermissionsQuery)

      userPermissions = userPermissionsResult.recordset
      userPermissionsCount = { total: userPermissions.length }

      // Get all user permissions for this microservice (for debugging)
      const allUserPermissionsQuery = `
        SELECT 
          up.id,
          up.user_id,
          up.permission_id,
          up.granted_at,
          up.expires_at,
          up.is_active,
          p.permission_code,
          p.permission_name,
          au.email,
          au.first_name,
          au.last_name
        FROM user_permissions up
        INNER JOIN permissions p ON up.permission_id = p.id
        INNER JOIN app_users au ON up.user_id = au.id
        INNER JOIN microservice_apps ma ON p.microservice_id = ma.id
        WHERE ma.app_code = @param0
        ORDER BY au.email, p.permission_code
      `
      const allUserPermissionsResult = await connection
        .request()
        .input("param0", MICROSERVICE_CONFIG.code)
        .query(allUserPermissionsQuery)

      allUserPermissions = allUserPermissionsResult.recordset
    }

    return NextResponse.json({
      success: true,
      debug: {
        auth,
        appUser,
        microservice,
        permissionsInTable,
        userPermissions,
        userPermissionsCount,
        allUserPermissions,
      },
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    console.error("❌ Navigation Debug API error:", errorMessage)
    console.error("❌ Full error object:", error)

    return NextResponse.json({
      success: false,
      error: errorMessage,
      debug: null,
    })
  }
}
