import { NextResponse, type NextRequest } from "next/server"
import { auth, currentUser } from "@clerk/nextjs/server"
import { query } from "@/lib/db"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

/**
 * Quick debug endpoint to show current user's Clerk ID and matching app_users record
 * This helps identify which user record is active in the database
 */
export async function GET(request: NextRequest) {
  try {
    // Get Clerk user ID
    let clerkUserId: string | null = null
    let clerkUserEmail: string | null = null
    
    try {
      const user = await currentUser()
      if (user?.id) {
        clerkUserId = user.id
        clerkUserEmail = user.emailAddresses[0]?.emailAddress || null
      } else {
        const authResult = await auth()
        clerkUserId = authResult?.userId || null
      }
    } catch (error) {
      console.error("Error getting Clerk user:", error)
    }

    if (!clerkUserId) {
      return NextResponse.json({
        error: "Not authenticated",
        clerkUserId: null,
      }, { status: 401 })
    }

    // Find matching app_users record(s)
    const appUsers = await query<{
      id: string
      clerk_user_id: string
      email: string
      first_name: string
      last_name: string
      core_role: string
      is_active: number
      created_at: string
      updated_at: string
    }>(
      `SELECT 
        id,
        clerk_user_id,
        email,
        first_name,
        last_name,
        core_role,
        is_active,
        created_at,
        updated_at
      FROM app_users
      WHERE clerk_user_id = @param0
      ORDER BY updated_at DESC`,
      [clerkUserId]
    )

    // Also check for records with the same email (to find duplicates)
    let duplicateRecords: any[] = []
    if (clerkUserEmail) {
      duplicateRecords = await query<{
        id: string
        clerk_user_id: string | null
        email: string
        first_name: string
        last_name: string
        is_active: number
      }>(
        `SELECT 
          id,
          clerk_user_id,
          email,
          first_name,
          last_name,
          is_active
        FROM app_users
        WHERE email = @param0
        ORDER BY 
          CASE WHEN clerk_user_id = @param1 THEN 0 ELSE 1 END,
          updated_at DESC`,
        [clerkUserEmail, clerkUserId]
      )
    }

    // Check for impersonation
    const impersonatedUserId = request.cookies.get("impersonate_user_id")?.value

    return NextResponse.json({
      success: true,
      clerk: {
        userId: clerkUserId,
        email: clerkUserEmail,
      },
      appUsers: {
        matchingByClerkId: appUsers.map(u => ({
          id: u.id,
          clerk_user_id: u.clerk_user_id,
          email: u.email,
          name: `${u.first_name} ${u.last_name}`,
          core_role: u.core_role,
          is_active: u.is_active === 1,
          created_at: u.created_at,
          updated_at: u.updated_at,
          isActiveRecord: true, // This is the active record
        })),
        allWithSameEmail: duplicateRecords.map(u => ({
          id: u.id,
          clerk_user_id: u.clerk_user_id,
          email: u.email,
          name: `${u.first_name} ${u.last_name}`,
          is_active: u.is_active === 1,
          isActiveRecord: u.clerk_user_id === clerkUserId,
          isDuplicate: u.clerk_user_id !== clerkUserId && u.clerk_user_id !== null && u.clerk_user_id !== '',
          hasNoClerkId: u.clerk_user_id === null || u.clerk_user_id === '',
        })),
      },
      impersonation: {
        isImpersonating: !!impersonatedUserId,
        impersonatedUserId: impersonatedUserId || null,
      },
      recommendations: {
        activeRecordId: appUsers.length > 0 ? appUsers[0].id : null,
        duplicateCount: duplicateRecords.filter(u => u.id !== appUsers[0]?.id).length,
        recordsToDelete: duplicateRecords
          .filter(u => u.clerk_user_id !== clerkUserId && (u.clerk_user_id === null || u.clerk_user_id === ''))
          .map(u => u.id),
      },
    })
  } catch (error) {
    console.error("Error in user-id debug endpoint:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to get user ID",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}

