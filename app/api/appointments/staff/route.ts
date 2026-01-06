import { NextResponse } from "next/server"
import { query } from "@refugehouse/shared-core/db"
import { shouldUseRadiusApiClient } from "@/lib/microservice-config"
import { radiusApiClient } from "@refugehouse/radius-api-client"
import { addNoCacheHeaders, DYNAMIC_ROUTE_CONFIG } from "@/lib/api-cache-utils"

export const dynamic = DYNAMIC_ROUTE_CONFIG.dynamic
export const revalidate = DYNAMIC_ROUTE_CONFIG.revalidate
export const fetchCache = DYNAMIC_ROUTE_CONFIG.fetchCache
export const runtime = "nodejs"

// GET - Fetch available staff members for appointment assignment
export async function GET() {
  try {
    console.log("👥 [API] Fetching available staff members")

    const useApiClient = shouldUseRadiusApiClient()

    let staff: any[]

    if (useApiClient) {
      // Use Radius API client for non-admin microservices
      console.log(`✅ [API] Using API client for staff members`)
      
      const apiUsers = await radiusApiClient.getUsers({ isActive: true })
      
      // Filter to @refugehouse.org email domain and transform
      staff = apiUsers
        .filter((user) => user.email && user.email.includes('@refugehouse.org'))
        .map((user) => ({
          id: user.clerk_user_id || user.id,
          appUserId: user.id, // GUID for database operations
          name: `${user.first_name || ""} ${user.last_name || ""}`.trim(),
          email: user.email,
          phone: null, // API doesn't return phone currently
          type: "user",
        }))
        .sort((a, b) => a.name.localeCompare(b.name))
      
      // Deduplicate by email to ensure uniqueness
      const uniqueStaff = new Map()
      staff.forEach((member) => {
        const emailKey = member.email?.toLowerCase() || member.id
        if (emailKey && !uniqueStaff.has(emailKey)) {
          uniqueStaff.set(emailKey, member)
        }
      })
      staff = Array.from(uniqueStaff.values())
    } else {
      // Direct database access for admin microservice
      console.log(`⚠️ [API] Using direct DB access for staff (admin microservice)`)
      
      // Fetch unique app_users with @refugehouse.org email domain
      // No role information needed - just ensure all unique users are represented
      const dbStaff = await query(`
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
      dbStaff.forEach((member) => {
        const emailKey = member.email?.toLowerCase() || member.id
        if (emailKey && !uniqueStaff.has(emailKey)) {
          uniqueStaff.set(emailKey, member)
        }
      })

      staff = Array.from(uniqueStaff.values()).map((member) => ({
        id: member.clerk_user_id || member.id,
        appUserId: member.id, // GUID for database operations
        name: `${member.first_name} ${member.last_name}`.trim(),
        email: member.email,
        phone: member.phone || null,
        type: "user",
      }))
    }

    console.log(
      `✅ [API] Retrieved ${staff.length} unique staff members with @refugehouse.org domain`,
    )

    const response = NextResponse.json({
      success: true,
      staff,
      timestamp: new Date().toISOString(),
    })
    return addNoCacheHeaders(response)
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
