import { NextResponse, type NextRequest } from "next/server"
import { query } from "@/lib/db"
import { MICROSERVICE_CONFIG } from "@/lib/microservice-config"

export const dynamic = "force-dynamic"

const CURRENT_MICROSERVICE_CODE = MICROSERVICE_CONFIG.code

export async function GET() {
  try {
    console.log(`🔍 Fetching users filtered by ${CURRENT_MICROSERVICE_CODE} microservice...`)

    // Get users from app_users table
    const users = await query(`
      SELECT [id], [clerk_user_id], [email], [first_name], [last_name], [is_active], [created_at], [updated_at] 
      FROM app_users
      ORDER BY created_at DESC
    `)

    console.log(`✅ Found ${users.length} total users`)

    // Get user roles filtered by current microservice
    const userRoles = await query(
      `
      SELECT 
        ur.[id],
        ur.[user_id],
        ur.[microservice_id],
        ur.[role_name],
        ur.[granted_by],
        ur.[granted_at],
        ur.[is_active]
      FROM user_roles ur
      INNER JOIN microservice_apps ma ON ur.microservice_id = ma.id
      WHERE ma.app_code = @param0
      ORDER BY ur.granted_at DESC
    `,
      [CURRENT_MICROSERVICE_CODE],
    )

    console.log(`✅ Found ${userRoles.length} user roles for ${CURRENT_MICROSERVICE_CODE} microservice`)

    // Get user permissions filtered by current microservice
    const userPermissions = await query(
      `
      SELECT 
        up.[id],
        up.[user_id],
        up.[permission_id],
        up.[granted_by],
        up.[granted_at],
        up.[expires_at],
        up.[is_active]
      FROM user_permissions up
      INNER JOIN permissions p ON up.permission_id = p.id
      INNER JOIN microservice_apps ma ON p.microservice_id = ma.id
      WHERE ma.app_code = @param0
      ORDER BY up.granted_at DESC
    `,
      [CURRENT_MICROSERVICE_CODE],
    )

    console.log(`✅ Found ${userPermissions.length} user permissions for ${CURRENT_MICROSERVICE_CODE} microservice`)

    // Get permissions filtered by current microservice
    const permissions = await query(
      `
      SELECT 
        p.[id],
        p.[microservice_id],
        p.[permission_code],
        p.[permission_name],
        p.[description],
        p.[category],
        p.[created_at]
      FROM permissions p
      INNER JOIN microservice_apps ma ON p.microservice_id = ma.id
      WHERE ma.app_code = @param0
      ORDER BY p.category, p.permission_name
    `,
      [CURRENT_MICROSERVICE_CODE],
    )

    console.log(`✅ Found ${permissions.length} permissions for ${CURRENT_MICROSERVICE_CODE} microservice`)

    // Get the current microservice app info
    const microserviceApp = await query(
      `
      SELECT 
        [id],
        [app_code],
        [app_name],
        [app_url],
        [description],
        [is_active],
        [created_at]
      FROM microservice_apps
      WHERE app_code = @param0
    `,
      [CURRENT_MICROSERVICE_CODE],
    )

    console.log(`✅ Found microservice app:`, microserviceApp[0])

    // Create users with their roles for this microservice
    const usersWithRoles = users.map((user) => {
      const userRolesForUser = userRoles.filter((role) => role.user_id === user.id)
      const userPermissionsForUser = userPermissions.filter((perm) => perm.user_id === user.id)

      return {
        ...user,
        roles: userRolesForUser.map((role) => role.role_name),
        permissions: userPermissionsForUser.map((perm) => {
          const permission = permissions.find((p) => p.id === perm.permission_id)
          return permission ? permission.permission_code : "unknown"
        }),
        microservice_roles: userRolesForUser,
      }
    })

    const responseData = {
      users: users,
      usersWithRoles: usersWithRoles,
      userRoles: userRoles,
      userPermissions: userPermissions,
      permissions: permissions,
      microserviceApps: microserviceApp,
      total: users.length,
      debug: {
        totalUsers: users.length,
        totalUserRoles: userRoles.length,
        totalUserPermissions: userPermissions.length,
        totalPermissions: permissions.length,
        microserviceCode: CURRENT_MICROSERVICE_CODE,
        microserviceName: microserviceApp[0]?.app_name || "Unknown",
      },
    }

    console.log(`✅ Response data filtered for ${CURRENT_MICROSERVICE_CODE} microservice`)

    return NextResponse.json(responseData)
  } catch (error) {
    console.error("❌ Error fetching users:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch users",
        details: error instanceof Error ? error.message : "Unknown error",
        users: [],
        usersWithRoles: [],
        total: 0,
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, firstName, lastName } = body

    if (!email || !firstName || !lastName) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Create new user
    const result = await query(
      `
      INSERT INTO app_users (email, first_name, last_name, is_active, created_at)
      OUTPUT INSERTED.*
      VALUES (@param0, @param1, @param2, 1, GETDATE())
    `,
      [email, firstName, lastName],
    )

    return NextResponse.json({ user: result[0] }, { status: 201 })
  } catch (error) {
    console.error("Error creating user:", error)
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 })
  }
}
