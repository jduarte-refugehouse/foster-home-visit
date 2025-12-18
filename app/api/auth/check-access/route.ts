import { type NextRequest, NextResponse } from "next/server"
import { checkUserAccess } from "@refugehouse/shared-core/user-access"
import { requireClerkAuth } from "@refugehouse/shared-core/auth"
import { getMicroserviceCode, shouldUseRadiusApiClient } from "@/lib/microservice-config"
import { getUserRolesForMicroservice, getUserPermissionsForMicroservice } from "@refugehouse/shared-core/user-management"
import { getEffectiveUser } from "@refugehouse/shared-core/impersonation"
import { isSystemAdmin } from "@refugehouse/shared-core/system-admin"
import { radiusApiClient } from "@refugehouse/radius-api-client"

/**
 * @shared-core
 * This API route should be moved to packages/shared-core/app/api/auth/check-access/route.ts
 * Check if the current user has access to the platform AND microservice-specific permissions
 * - refugehouse.org users: always allowed to platform
 * - External users: must have app_user record OR invitation
 * - All users: must have microservice-specific roles or permissions
 * 
 * Sends email notification to jduarte@refugehouse.org if new user without access tries to log in
 */
export async function GET(request: NextRequest) {
  try {
    // #region agent log
    const headerClerkId = request.headers.get("x-user-clerk-id");
    const headerEmail = request.headers.get("x-user-email");
    const headerName = request.headers.get("x-user-name");
    const allHeaders = Array.from(request.headers.entries()).map(([k, v]) => ({ k, v: k.toLowerCase().includes('auth') || k.toLowerCase().includes('user') ? v.substring(0, 20) + '...' : v }));
    console.log("🔍 [DEBUG] check-access GET entry:", JSON.stringify({ url: request.url, hasClerkId: !!headerClerkId, hasEmail: !!headerEmail, hasName: !!headerName, headers: allHeaders }, null, 2));
    // #endregion
    // Get Clerk user info from headers OR session cookies
    // This allows mobile to work where headers might not be sent
    let clerkUserId: string | null = null
    let email: string | null = null
    let name: string | null = null

    // Get credentials from headers (stored after initial Clerk authentication)
    // NO CLERK API CALLS - only use stored credentials
    try {
      const auth = requireClerkAuth(request)
      clerkUserId = auth.clerkUserId
      email = auth.email
      name = auth.name
      // #region agent log
      console.log("✅ [DEBUG] requireClerkAuth success:", JSON.stringify({ clerkUserId: clerkUserId?.substring(0, 20) + '...', email, name }, null, 2));
      // #endregion
    } catch (authError) {
      // #region agent log
      console.error("❌ [DEBUG] requireClerkAuth failed:", authError instanceof Error ? authError.message : String(authError));
      console.error("❌ [DEBUG] Headers received:", JSON.stringify({ clerkId: headerClerkId, email: headerEmail, name: headerName }, null, 2));
      // #endregion
      // Headers not available - user must send credentials in headers
      // NO FALLBACK TO CLERK SESSION - all requests must use headers
      return NextResponse.json(
        {
          error: "Unauthorized",
          details: "Missing authentication headers. Please ensure credentials are sent in x-user-clerk-id, x-user-email, and x-user-name headers.",
        },
        { status: 401 },
      )
    }

    if (!clerkUserId || !email) {
      return NextResponse.json(
        {
          error: "Unauthorized",
          details: "Unable to determine authenticated user.",
        },
        { status: 401 },
      )
    }

    if (!email) {
      return NextResponse.json({ error: "Email address required" }, { status: 400 })
    }

    // Check user access to platform (existing check)
    const accessCheck = await checkUserAccess(
      clerkUserId,
      email,
      name?.split(" ")[0] || undefined,
      name?.split(" ").slice(1).join(" ") || undefined,
    )

    if (!accessCheck.hasAccess) {
      return NextResponse.json(
        {
          error: "Access denied. External users require an invitation to join.",
          requiresInvitation: true,
          isNewUser: accessCheck.isNewUser,
        },
        { status: 403 },
      )
    }

    // NEW: Check microservice-specific access
    const microserviceCode = getMicroserviceCode()
    const useApiClient = shouldUseRadiusApiClient()
    
    // SECURITY: System admins - check email directly using centralized function
    // Only specific emails can be system admins - this prevents accidental access
    const isSystemAdminUser = isSystemAdmin(email)

    let hasMicroserviceAccess = false
    let roles: string[] = []
    let permissions: string[] = []

    if (isSystemAdminUser) {
      // System admins always have access to all microservices
      hasMicroserviceAccess = true
    } else {
      // Use API client for non-admin microservices, direct DB for admin
      if (useApiClient) {
        try {
          // Get user via API client
          const lookupResult = await radiusApiClient.lookupUser({
            clerkUserId,
            email,
            microserviceCode: microserviceCode,
          })

          if (!lookupResult.found || !lookupResult.user) {
            return NextResponse.json({ error: "User not found in system" }, { status: 404 })
          }

          const userId = lookupResult.user.id

          // Get permissions via API client
          const permissionsResponse = await radiusApiClient.getPermissions({
            userId,
            microserviceCode: microserviceCode,
          })

          // User must have at least one active role OR one active permission
          hasMicroserviceAccess = permissionsResponse.roles.length > 0 || permissionsResponse.permissions.length > 0
          roles = permissionsResponse.roles.map((r: any) => r.role_name)
          permissions = permissionsResponse.permissionCodes
        } catch (apiError) {
          console.error("❌ [AUTH] Error checking access via API Hub:", apiError)
          // Fail securely - deny access if API call fails
          return NextResponse.json(
            {
              error: "Failed to check microservice access",
              details: apiError instanceof Error ? apiError.message : "Unknown error",
            },
            { status: 500 }
          )
        }
      } else {
        // Admin microservice: use direct DB access (existing code)
        // Get effective user (handles impersonation)
        const user = await getEffectiveUser(clerkUserId, request)
        if (!user) {
          return NextResponse.json({ error: "User not found in system" }, { status: 404 })
        }

        // All other users (including @refugehouse.org) must have explicit roles or permissions
        // This ensures we don't accidentally grant access
        // Using exact field names from schema: user_roles.role_name, permissions.permission_code
        const userRoles = await getUserRolesForMicroservice(user.id, microserviceCode)
        const userPermissions = await getUserPermissionsForMicroservice(user.id, microserviceCode)
        
        // User must have at least one active role OR one active permission
        hasMicroserviceAccess = userRoles.length > 0 || userPermissions.length > 0
        roles = userRoles.map(r => r.role_name)
        permissions = userPermissions.map(p => p.permission_code)
      }
    }

    return NextResponse.json({
      success: true,
      hasAccess: true,
      hasMicroserviceAccess,
      userExists: accessCheck.userExists,
      hasInvitation: accessCheck.hasInvitation,
      isNewUser: accessCheck.isNewUser,
      microserviceCode,
      roles,
      permissions,
      isSystemAdmin: isSystemAdminUser,
    })
  } catch (error) {
    console.error("❌ [AUTH] Error checking user access:", error)
    return NextResponse.json(
      {
        error: "Failed to check user access",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

