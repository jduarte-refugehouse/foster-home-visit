import { NextResponse } from "next/server"
import { query } from "@/lib/db"
import { MICROSERVICE_CONFIG } from "@/lib/microservice-config"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    console.log("🔍 Fetching roles filtered by current microservice...")

    // Get the microservice ID from the database using the configurable code
    const microserviceResult = await query(`SELECT id FROM microservice_apps WHERE app_code = @param0`, [
      MICROSERVICE_CONFIG.code,
    ])

    if (microserviceResult.length === 0) {
      console.error(`❌ Microservice with code '${MICROSERVICE_CONFIG.code}' not found`)
      return NextResponse.json(
        {
          error: `Microservice '${MICROSERVICE_CONFIG.code}' not found`,
          allRoles: [],
          uniqueRoles: [],
        },
        { status: 404 },
      )
    }

    const microserviceId = microserviceResult[0].id

    // Get user roles filtered by current microservice only
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
      [microserviceId],
    )

    console.log(`✅ Found ${allRoles.length} roles for ${MICROSERVICE_CONFIG.name} microservice`)

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
          description: `Role: ${role.role_name} for ${MICROSERVICE_CONFIG.name} microservice`,
          user_count: roleCount.length,
          active_user_count: activeCount.length,
          permissions: "Various permissions",
        })
      }
      return acc
    }, [])

    console.log(`✅ Found ${uniqueRoles.length} unique roles for ${MICROSERVICE_CONFIG.name} microservice`)

    return NextResponse.json({
      allRoles: allRoles,
      uniqueRoles: uniqueRoles,
      total: allRoles.length,
      microserviceId: microserviceId,
      microserviceName: MICROSERVICE_CONFIG.name,
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
