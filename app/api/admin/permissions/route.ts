import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { query } from "@/lib/db"

export async function GET() {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get all permissions for the home-visits microservice
    const permissions = await query(`
      SELECT 
        p.id,
        p.microservice_id,
        p.permission_code,
        p.permission_name,
        p.description,
        p.category,
        p.created_at,
        ma.app_name,
        ma.app_code
      FROM permissions p
      INNER JOIN microservice_apps ma ON p.microservice_id = ma.id
      WHERE ma.app_code = 'home-visits'
      ORDER BY p.category, p.permission_name
    `)

    return NextResponse.json(permissions)
  } catch (error) {
    console.error("Error fetching permissions:", error)
    return NextResponse.json(
      { error: "Failed to fetch permissions", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
