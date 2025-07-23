import { NextResponse, type NextRequest } from "next/server"
import { query } from "@/lib/db"

export const dynamic = "force-dynamic"

// Home Visits microservice GUID
const HOME_VISITS_MICROSERVICE_ID = "1A5F93AC-9286-48FD-849D-BB132E5031C7"

export async function GET() {
  try {
    console.log("🔍 Fetching users filtered by home-visits microservice...")

    // Get users from app_users table (no filtering needed here as this is the main user table)
    const users = await query(`
      SELECT [id], [clerk_user_id], [email], [first_name], [last_name], [is_active], [created_at], [updated_at] 
      FROM app_users
      ORDER BY created_at DESC
    `)

    console.log(`✅ Found ${users.length} total users`)

    // Get user roles filtered by home-visits microservice
    const userRoles = await query(
      `
      SELECT 
        [id],
        [user_id],
        [microservice_id],
        [role_name],
        [granted_by],
        [granted_at],
        [is_active]
      FROM user_roles
      WHERE microservice_id = @param0
      ORDER BY granted_at DESC
    `,
      [HOME_VISITS_MICROSERVICE_ID],
    )

    console.log(`✅ Found ${userRoles.length} user roles for home-visits microservice`)

    // Get user permissions filtered by home-visits microservice
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
      WHERE p.microservice_id = @param0
      ORDER BY up.granted_at DESC
    `,
      [HOME_VISITS_MICROSERVICE_ID],
    )

    console.log(`✅ Found ${userPermissions.length} user permissions for home-visits microservice`)

    // Get permissions filtered by home-visits microservice
    const permissions = await query(
      `
      SELECT 
        [id],
        [microservice_id],
        [permission_code],
        [permission_name],
        [description],
        [category],
        [created_at]
      FROM permissions
      WHERE microservice_id = @param0
      ORDER BY category, permission_name
    `,
      [HOME_VISITS_MICROSERVICE_ID],
    )

    console.log(`✅ Found ${permissions.length} permissions for home-visits microservice`)

    // Get the home-visits microservice app info
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
      WHERE id = @param0
    `,
      [HOME_VISITS_MICROSERVICE_ID],
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
        microserviceId: HOME_VISITS_MICROSERVICE_ID,
        microserviceName: microserviceApp[0]?.app_name || "Unknown",
      },
    }

    console.log("✅ Response data filtered for home-visits microservice")

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
