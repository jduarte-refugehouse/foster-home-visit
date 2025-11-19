import { NextResponse } from "next/server"
import { query } from "@refugehouse/shared-core/db"

export const dynamic = "force-dynamic"

// Home Visits microservice GUID
const HOME_VISITS_MICROSERVICE_ID = "1A5F93AC-9286-48FD-849D-BB132E5031C7"

export async function GET() {
  try {
    console.log("🔍 Fetching system status for home-visits microservice...")

    // Get total users (not filtered by microservice as users are shared)
    const userCount = await query("SELECT COUNT(*) as count FROM app_users")
    const activeUserCount = await query("SELECT COUNT(*) as count FROM app_users WHERE is_active = 1")

    // Get roles filtered by home-visits microservice
    const roleCount = await query(
      `
      SELECT COUNT(DISTINCT role_name) as count 
      FROM user_roles 
      WHERE microservice_id = @param0
    `,
      [HOME_VISITS_MICROSERVICE_ID],
    )

    // Get permissions filtered by home-visits microservice
    const permissionCount = await query(
      `
      SELECT COUNT(*) as count 
      FROM permissions 
      WHERE microservice_id = @param0
    `,
      [HOME_VISITS_MICROSERVICE_ID],
    )

    // Get user roles count for home-visits microservice
    const userRoleAssignments = await query(
      `
      SELECT COUNT(*) as count 
      FROM user_roles 
      WHERE microservice_id = @param0 AND is_active = 1
    `,
      [HOME_VISITS_MICROSERVICE_ID],
    )

    // Get the microservice info
    const microserviceApp = await query(
      `
      SELECT app_name, app_code 
      FROM microservice_apps 
      WHERE id = @param0
    `,
      [HOME_VISITS_MICROSERVICE_ID],
    )

    console.log("✅ System status counts for home-visits:", {
      users: userCount[0]?.count || 0,
      activeUsers: activeUserCount[0]?.count || 0,
      roles: roleCount[0]?.count || 0,
      permissions: permissionCount[0]?.count || 0,
      userRoleAssignments: userRoleAssignments[0]?.count || 0,
    })

    return NextResponse.json({
      database: "connected",
      environment: process.env.NODE_ENV || "development",
      version: "1.0.0",
      uptime: process.uptime ? `${Math.floor(process.uptime() / 60)} minutes` : "Unknown",
      totalUsers: userCount[0]?.count || 0,
      activeUsers: activeUserCount[0]?.count || 0,
      totalRoles: roleCount[0]?.count || 0,
      totalPermissions: permissionCount[0]?.count || 0,
      userRoleAssignments: userRoleAssignments[0]?.count || 0,
      microserviceId: HOME_VISITS_MICROSERVICE_ID,
      microserviceName: microserviceApp[0]?.app_name || "Home Visits",
      microserviceCode: microserviceApp[0]?.app_code || "home-visits",
      lastCheck: new Date().toISOString(),
    })
  } catch (error) {
    console.error("❌ Error fetching system status:", error)
    return NextResponse.json(
      {
        database: "error",
        environment: process.env.NODE_ENV || "development",
        version: "1.0.0",
        uptime: "Unknown",
        totalUsers: 0,
        activeUsers: 0,
        totalRoles: 0,
        totalPermissions: 0,
        userRoleAssignments: 0,
        lastCheck: new Date().toISOString(),
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
