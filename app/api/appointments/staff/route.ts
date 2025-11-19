import { NextResponse } from "next/server"
import { query } from "@refugehouse/shared-core/db"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

// GET - Fetch available staff members for appointment assignment
export async function GET() {
  try {
    console.log("👥 [API] Fetching available staff members")

    // Fetch unique app_users with @refugehouse.org email domain
    // No role information needed - just ensure all unique users are represented
    const staff = await query(`
      SELECT DISTINCT
        u.id,
        u.clerk_user_id,
        u.email,
        u.phone,
        u.first_name,
        u.last_name,
        u.is_active
      FROM app_users u
      WHERE u.is_active = 1
        AND (u.clerk_user_id IS NOT NULL OR u.email IS NOT NULL)
        AND u.email LIKE '%@refugehouse.org'
      ORDER BY u.first_name, u.last_name
    `)

    // Deduplicate by email to ensure uniqueness
    const uniqueStaff = new Map()
    staff.forEach((member) => {
      const emailKey = member.email?.toLowerCase() || member.id
      if (emailKey && !uniqueStaff.has(emailKey)) {
        uniqueStaff.set(emailKey, member)
      }
    })

    console.log(
      `✅ [API] Retrieved ${uniqueStaff.size} unique staff members with @refugehouse.org domain`,
    )

    return NextResponse.json({
      success: true,
      staff: Array.from(uniqueStaff.values()).map((member) => ({
        id: member.clerk_user_id || member.id,
        appUserId: member.id, // GUID for database operations
        name: `${member.first_name} ${member.last_name}`.trim(),
        email: member.email,
        phone: member.phone || null,
        type: "user",
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
