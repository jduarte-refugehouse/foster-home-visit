import { NextResponse } from "next/server"
import { query } from "@/lib/db"

export const dynamic = "force-dynamic"

// Home Visits microservice GUID
const HOME_VISITS_MICROSERVICE_ID = "1A5F93AC-9286-48FD-849D-BB132E5031C7"

export async function GET() {
  try {
    console.log("🔍 Fetching roles filtered by home-visits microservice...")

    // Get user roles filtered by home-visits microservice only
    const allRoles = await query(
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

    console.log(`✅ Found ${allRoles.length} roles for home-visits microservice`)

    // Get unique roles with counts for this microservice only
    const uniqueRoles = allRoles.reduce((acc: any[], role: any) => {
      const existing = acc.find((r) => r.role_name === role.role_name)
      if (!existing) {
        const roleCount = allRoles.filter((r) => r.role_name === role.role_name)
        const activeCount = roleCount.filter((r) => r.is_active === 1)

        acc.push({
          role_name: role.role_name,
          role_display_name: role.role_name,
          role_level: 1,
          description: `Role: ${role.role_name} for Home Visits microservice`,
          user_count: roleCount.length,
          active_user_count: activeCount.length,
          permissions: "Various permissions",
        })
      }
      return acc
    }, [])

    console.log(`✅ Found ${uniqueRoles.length} unique roles for home-visits microservice`)

    return NextResponse.json({
      allRoles: allRoles,
      uniqueRoles: uniqueRoles,
      total: allRoles.length,
      microserviceId: HOME_VISITS_MICROSERVICE_ID,
      microserviceName: "Home Visits",
    })
  } catch (error) {
    console.error("❌ Error fetching roles:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch roles",
        details: error instanceof Error ? error.message : "Unknown error",
        allRoles: [],
        uniqueRoles: [],
      },
      { status: 500 },
    )
  }
}
