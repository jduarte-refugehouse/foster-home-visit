import { auth } from "@clerk/nextjs/server"
import { getUserByClerkId } from "./user-management"

export async function checkPermission(requiredRole: string | string[]) {
  const { userId } = await auth()

  if (!userId) {
    return { authorized: false, user: null }
  }

  const user = await getUserByClerkId(userId)

  if (!user) {
    return { authorized: false, user: null }
  }

  const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole]
  const authorized = roles.includes(user.role)

  return { authorized, user }
}

export async function requireAuth() {
  const { userId } = await auth()

  if (!userId) {
    throw new Error("Authentication required")
  }

  return userId
}

export async function requireRole(role: string | string[]) {
  const { authorized, user } = await checkPermission(role)

  if (!authorized) {
    throw new Error("Insufficient permissions")
  }

  return user
}
