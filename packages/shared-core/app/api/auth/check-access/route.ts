import { type NextRequest, NextResponse } from "next/server"
import { checkUserAccess } from "@/lib/user-access-check"
import { requireClerkAuth } from "@refugehouse/shared-core/auth"
import { getMicroserviceCode } from "@/lib/microservice-config"
import { getUserRolesForMicroservice, getUserPermissionsForMicroservice } from "@/lib/user-management"
import { getEffectiveUser } from "@/lib/impersonation"
import { isSystemAdmin } from "@refugehouse/shared-core/system-admin"

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
    // Get Clerk user info from headers OR session cookies
    // This allows mobile to work where headers might not be sent
    let clerkUserId: string | null = null
    let email: string | null = null
    let name: string | null = null

    // Try headers first (desktop/tablet)
    try {
      const auth = requireClerkAuth(request)
      clerkUserId = auth.clerkUserId
      email = auth.email
      name = auth.name
    } catch (authError) {
      // Headers not available - try session cookie (mobile)
      // Import currentUser to read from session cookie
      const { currentUser } = await import("@clerk/nextjs/server")
      try {
        const user = await currentUser()
        if (user) {
          clerkUserId = user.id
          email = user.emailAddresses[0]?.emailAddress || null
          name = `${user.firstName || ""} ${user.lastName || ""}`.trim() || null
        }
      } catch (sessionError) {
        // No session either - user is not authenticated
        return NextResponse.json(
          {
            error: "Unauthorized",
            details: "Not authenticated. Please sign in.",
          },
          { status: 401 },
        )
      }
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
    
    // Get effective user (handles impersonation)
    const user = await getEffectiveUser(clerkUserId, request)
    if (!user) {
      return NextResponse.json({ error: "User not found in system" }, { status: 404 })
    }

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

