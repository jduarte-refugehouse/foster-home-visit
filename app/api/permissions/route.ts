import { NextResponse, type NextRequest } from "next/server"
import { clerkClient } from "@clerk/nextjs/server"
import { createOrUpdateAppUser, getUserProfile, CURRENT_MICROSERVICE } from "@refugehouse/shared-core/user-management"
import { requireClerkAuth } from "@refugehouse/shared-core/auth"
import { getMicroserviceCode, getDeploymentEnvironment } from "@/lib/microservice-config"

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
    
    // Get deployment environment for filtering
    const microserviceCode = getMicroserviceCode()
    const isServiceDomainAdmin = microserviceCode === 'service-domain-admin'
    const deploymentEnv = isServiceDomainAdmin ? getDeploymentEnvironment() : null
    
    console.log(`🌍 [PERMISSIONS] Deployment environment: ${deploymentEnv} (microservice: ${microserviceCode})`)
    
    let appUser
    
    // Build environment filter condition
    const buildUserQuery = (baseCondition: string, params: any[]): [string, any[]] => {
      if (isServiceDomainAdmin) {
        let query = baseCondition + " AND (user_type = 'global_admin' OR user_type IS NULL) AND is_active = 1"
        if (deploymentEnv) {
          query += " AND environment = @param" + params.length
          return [query, [...params, deploymentEnv]]
        }
        return [query, params]
      } else {
        return [baseCondition + " AND is_active = 1", params]
      }
    }
    
    if (impersonatedUserId) {
      // Use impersonated user directly
      try {
        const { query } = await import("@refugehouse/shared-core/db")
        const [userQuery, queryParams] = buildUserQuery(
          "SELECT * FROM app_users WHERE id = @param0",
          [impersonatedUserId]
        )
        const result = await query(userQuery, queryParams)
        appUser = result[0] || null
      } catch (dbError) {
        console.error("❌ [API] Database error fetching impersonated user:", dbError)
        // Fall back to real user if impersonation lookup fails
        // PRIORITY: Use clerk_user_id first, then email
        if (clerkUserId.startsWith('user_')) {
          const { query } = await import("@refugehouse/shared-core/db")
          const [userQuery, queryParams] = buildUserQuery(
            "SELECT * FROM app_users WHERE clerk_user_id = @param0",
            [clerkUserId]
          )
          const result = await query(userQuery, queryParams)
          appUser = result[0] || null
        } else if (clerkUserEmail) {
          const { query } = await import("@refugehouse/shared-core/db")
          const [userQuery, queryParams] = buildUserQuery(
            "SELECT * FROM app_users WHERE email = @param0",
            [clerkUserEmail]
          )
          const result = await query(userQuery, queryParams)
          appUser = result[0] || null
        }
      }
    } else {
      // Not impersonating - use real user
      // PRIORITY: Use clerk_user_id first (most reliable identifier)
      if (clerkUserId.startsWith('user_')) {
        // Valid Clerk ID - look up directly by clerk_user_id
        const { query } = await import("@refugehouse/shared-core/db")
        const [userQuery, queryParams] = buildUserQuery(
          "SELECT * FROM app_users WHERE clerk_user_id = @param0",
          [clerkUserId]
        )
        const result = await query(userQuery, queryParams)
        appUser = result[0] || null
        
        // If not found by clerk_user_id, try to sync from Clerk API (but still filter)
        if (!appUser) {
          try {
            const clerk = await clerkClient()
            const clerkUser = await clerk.users.getUser(clerkUserId)
            if (!clerkUser) {
              return NextResponse.json({ error: "Clerk user not found." }, { status: 404 })
            }
            // This function syncs the Clerk user with your local app_users table
            const syncedUser = await createOrUpdateAppUser(clerkUser)
            // Verify the synced user has the correct user_type and environment
            if (isServiceDomainAdmin) {
              if ((syncedUser.user_type === 'global_admin' || syncedUser.user_type === null) 
                  && syncedUser.is_active 
                  && (!deploymentEnv || syncedUser.environment === deploymentEnv)) {
                appUser = syncedUser
              } else {
                console.warn(`⚠️ [API] Synced user does not match requirements (type: ${syncedUser.user_type}, active: ${syncedUser.is_active}, env: ${syncedUser.environment})`)
                appUser = null
              }
            } else {
              if (syncedUser.is_active) {
                appUser = syncedUser
              } else {
                console.warn(`⚠️ [API] Synced user is inactive`)
                appUser = null
              }
            }
          } catch (clerkError) {
            console.error("❌ [API] Clerk error fetching user:", clerkError)
            // Fallback: try to find by email if we have it
            if (clerkUserEmail) {
              const { query } = await import("@refugehouse/shared-core/db")
              const [userQuery, queryParams] = buildUserQuery(
                "SELECT * FROM app_users WHERE email = @param0",
                [clerkUserEmail]
              )
              const result = await query(userQuery, queryParams)
              appUser = result[0] || null
            } else {
              return NextResponse.json({ 
                error: "Failed to fetch user from Clerk", 
                details: clerkError instanceof Error ? clerkError.message : "Unknown error" 
              }, { status: 500 })
            }
          }
        }
      } else if (clerkUserEmail) {
        // No valid Clerk ID but have email - look up by email (fallback)
        const { query } = await import("@refugehouse/shared-core/db")
        const [userQuery, queryParams] = buildUserQuery(
          "SELECT * FROM app_users WHERE email = @param0",
          [clerkUserEmail]
        )
        const result = await query(userQuery, queryParams)
        appUser = result[0] || null
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
