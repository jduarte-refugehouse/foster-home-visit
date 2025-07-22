import { NextResponse } from "next/server"
import { auth, clerkClient } from "@clerk/nextjs/server"
import { createOrUpdateAppUser, getUserProfile, CURRENT_MICROSERVICE } from "@/lib/user-management"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const { userId: clerkUserId } = auth()

    if (!clerkUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Fetch the full user object from Clerk
    const clerkUser = await clerkClient.users.getUser(clerkUserId)
    if (!clerkUser) {
      return NextResponse.json({ error: "Clerk user not found." }, { status: 404 })
    }

    // This function syncs the Clerk user with your local app_users table
    const appUser = await createOrUpdateAppUser(clerkUser)

    if (!appUser) {
      return NextResponse.json({ error: "App user not found or could not be created." }, { status: 404 })
    }

    // Fetch the user's roles and permissions from your database
    const userProfile = await getUserProfile(appUser.id)

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
    console.error("Error fetching user permissions:", error)
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred"
    return NextResponse.json({ error: "Failed to fetch permissions", details: errorMessage }, { status: 500 })
  }
}
