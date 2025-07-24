import { NextResponse } from "next/server"
import { query } from "@/lib/db"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    console.log("🔍 Fetching permissions for admin panel...")

    const permissions = await query(
      `
      SELECT DISTINCT
        p.id,
        p.permission_code,
        p.permission_name,
        p.permission_description,
        COUNT(rp.role_name) as role_count
      FROM permissions p
      LEFT JOIN role_permissions rp ON p.id = rp.permission_id
      LEFT JOIN user_roles ur ON rp.role_name = ur.role_name
      LEFT JOIN microservice_apps ma ON ur.microservice_id = ma.id
      WHERE ma.app_code = 'home-visits' OR ma.app_code IS NULL
      GROUP BY p.id, p.permission_code, p.permission_name, p.permission_description
      ORDER BY p.permission_code
    `,
      [],
    )

    console.log(`✅ Found ${permissions.length} permissions for home-visits microservice`)

    return NextResponse.json({
      permissions,
      total: permissions.length,
      microservice: {
        code: "home-visits",
        name: "Home Visits Application",
      },
    })
  } catch (error) {
    console.error("❌ Error fetching permissions:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch permissions",
        details: error instanceof Error ? error.message : "Unknown error",
        permissions: [],
        total: 0,
      },
      { status: 500 },
    )
  }
}
