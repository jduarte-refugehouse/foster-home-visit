import { NextResponse, type NextRequest } from "next/server"
import { clerkClient } from "@clerk/nextjs/server"
import { createOrUpdateAppUser, getUserProfile, CURRENT_MICROSERVICE } from "@/lib/user-management"
import { requireClerkAuth } from "@/lib/clerk-auth-helper"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    // SAFE: Get Clerk user ID from headers (no middleware required)
    let clerkUserId: string
    let clerkUserEmail: string | null = null
    
    try {
      const auth = requireClerkAuth(request)
      clerkUserId = auth.clerkUserId
      clerkUserEmail = auth.email
    } catch (authError) {
      console.error("❌ [API] Auth error in permissions GET:", authError)
      return NextResponse.json({ 
        error: "Authentication failed", 
        details: authError instanceof Error ? authError.message : "Missing authentication headers" 
      }, { status: 401 })
    }

    // Check for impersonation first
    const impersonatedUserId = request.cookies.get("impersonate_user_id")?.value
    
    let appUser
    
    if (impersonatedUserId) {
      // Use impersonated user directly
      try {
        const { query } = await import("@/lib/db")
        const result = await query("SELECT * FROM app_users WHERE id = @param0", [impersonatedUserId])
        appUser = result[0] || null
      } catch (dbError) {
        console.error("❌ [API] Database error fetching impersonated user:", dbError)
        // Fall back to real user if impersonation lookup fails
        const clerkUser = await clerkClient.users.getUser(clerkUserId)
        if (!clerkUser) {
          return NextResponse.json({ error: "Clerk user not found." }, { status: 404 })
        }
        appUser = await createOrUpdateAppUser(clerkUser)
      }
            } else {
              // If we have email but no Clerk ID, look up by email
              // Otherwise, try to get user from Clerk API (only if we have a valid Clerk ID)
              if (clerkUserEmail && !clerkUserId.startsWith('user_')) {
                // clerkUserId is actually an email, look up by email
                const { query } = await import("@/lib/db")
                const result = await query("SELECT * FROM app_users WHERE email = @param0", [clerkUserEmail])
                appUser = result[0] || null
              } else {
                // Fetch the full user object from Clerk and sync
                try {
                  const clerkUser = await clerkClient.users.getUser(clerkUserId)
                  if (!clerkUser) {
                    return NextResponse.json({ error: "Clerk user not found." }, { status: 404 })
                  }
                  // This function syncs the Clerk user with your local app_users table
                  appUser = await createOrUpdateAppUser(clerkUser)
                } catch (clerkError) {
                  console.error("❌ [API] Clerk error fetching user:", clerkError)
                  // Fallback: try to find by email if we have it
                  if (clerkUserEmail) {
                    const { query } = await import("@/lib/db")
                    const result = await query("SELECT * FROM app_users WHERE email = @param0", [clerkUserEmail])
                    appUser = result[0] || null
                  } else {
                    return NextResponse.json({ error: "Failed to fetch user from Clerk", details: clerkError instanceof Error ? clerkError.message : "Unknown error" }, { status: 500 })
                  }
                }
              }
            }

    if (!appUser) {
      return NextResponse.json({ error: "App user not found." }, { status: 404 })
    }

    // Fetch the user's roles and permissions from your database
    let userProfile
    try {
      userProfile = await getUserProfile(appUser.id)
    } catch (profileError) {
      console.error("❌ [API] Error fetching user profile:", profileError)
      return NextResponse.json({ 
        error: "Failed to fetch user profile", 
        details: profileError instanceof Error ? profileError.message : "Unknown error" 
      }, { status: 500 })
    }

    const permissionsForMicroservice = userProfile.permissions.filter(
      (p: any) => p.microservice_code === CURRENT_MICROSERVICE,
    )

    const rolesForMicroservice = userProfile.roles.filter((r: any) => r.microservice_code === CURRENT_MICROSERVICE)

    // Construct the response object for the frontend
    const response = {
      userId: appUser.id,
      email: appUser.email,
      coreRole: appUser.core_role,
      roles: rolesForMicroservice.map((r: any) => ({
        roleName: r.role_name,
        roleDisplayName: r.role_display_name,
        roleLevel: r.role_level,
        microservice: r.microservice_code,
      })),
      permissions: permissionsForMicroservice.map((p: any) => ({
        permissionCode: p.permission_code,
        permissionName: p.permission_name,
        category: p.category,
        microservice: p.microservice_code,
      })),
      isLoaded: true,
      testMode: false, // We are now in live mode
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error("❌ [API] Error fetching user permissions:", error)
    console.error("❌ [API] Error details:", {
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined,
    })
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred"
    return NextResponse.json(
      {
        error: "Failed to fetch permissions",
        details: errorMessage,
        errorType: error instanceof Error ? error.name : "Unknown",
        stack: process.env.NODE_ENV === "development" ? (error instanceof Error ? error.stack : undefined) : undefined,
      },
      { status: 500 }
    )
  }
}
