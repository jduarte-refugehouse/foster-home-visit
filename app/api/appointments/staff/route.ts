import { NextResponse } from "next/server"
import { query } from "@/lib/db"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

// GET - Fetch available staff members for appointment assignment
export async function GET() {
  try {
    console.log("👥 [API] Fetching available staff members")

    const staff = await query(`
      SELECT DISTINCT
        u.id,
        u.clerk_user_id,
        u.email,
        u.first_name,
        u.last_name,
        u.is_active,
        COALESCE(ur.role_name, 'Staff') as role_name
      FROM app_users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id AND ur.is_active = 1
      WHERE u.is_active = 1
      ORDER BY u.first_name, u.last_name
    `)

    // Also get case managers from SyncActiveHomes for reference
    const caseManagers = await query(`
      SELECT DISTINCT 
        CaseManager as name,
        CaseManagerEmail as email,
        'Case Manager' as role_name
      FROM SyncActiveHomes 
      WHERE CaseManager IS NOT NULL 
        AND CaseManager != '' 
        AND CaseManager != '~unassigned~'
      ORDER BY CaseManager
    `)

    const uniqueStaff = new Map()
    staff.forEach((member) => {
      const fullName = `${member.first_name} ${member.last_name}`.trim()
      if (!uniqueStaff.has(fullName)) {
        uniqueStaff.set(fullName, member)
      }
    })

    const uniqueCaseManagers = new Map()
    caseManagers.forEach((manager) => {
      if (!uniqueCaseManagers.has(manager.name)) {
        uniqueCaseManagers.set(manager.name, manager)
      }
    })

    console.log(
      `✅ [API] Retrieved ${uniqueStaff.size} unique staff members and ${uniqueCaseManagers.size} unique case managers`,
    )

    return NextResponse.json({
      success: true,
      staff: Array.from(uniqueStaff.values()).map((member) => ({
        id: member.clerk_user_id || member.id,
        name: `${member.first_name} ${member.last_name}`.trim(),
        email: member.email,
        role: member.role_name,
        type: "user",
      })),
      caseManagers: Array.from(uniqueCaseManagers.values()).map((manager) => ({
        id: `cm_${manager.name.replace(/\s+/g, "_").toLowerCase()}`,
        name: manager.name,
        email: manager.email,
        role: manager.role_name,
        type: "case_manager",
      })),
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("❌ [API] Error fetching staff:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch staff members",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
