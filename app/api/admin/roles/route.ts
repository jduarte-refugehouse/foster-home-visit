import { NextResponse } from "next/server"
import { query } from "@/lib/db"

export const dynamic = "force-dynamic"

// Use the same microservice ID as system-status API
const HOME_VISITS_MICROSERVICE_ID = "1A5F93AC-9286-48FD-849D-BB132E5031C7"

export async function GET() {
  try {
    console.log("🔍 Fetching roles for home-visits microservice...")

    // Use the EXACT same query logic as system-status API that shows "2" in the card
    const roles = await query(
      `
      SELECT DISTINCT 
        role_name,
        role_display_name,
        role_level,
        COUNT(user_id) as user_count
      FROM user_roles 
      WHERE microservice_id = @param0 AND is_active = 1
      GROUP BY role_name, role_display_name, role_level
      ORDER BY role_level DESC, role_name
    `,
      [HOME_VISITS_MICROSERVICE_ID],
    )

    console.log(`✅ Found ${roles.length} roles for home-visits microservice`)

    return NextResponse.json({
      roles,
      total: roles.length,
      microservice: {
        code: "home-visits",
        name: "Home Visits Application",
      },
    })
  } catch (error) {
    console.error("❌ Error fetching roles:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch roles",
        details: error instanceof Error ? error.message : "Unknown error",
        roles: [],
        total: 0,
      },
      { status: 500 },
    )
  }
}
