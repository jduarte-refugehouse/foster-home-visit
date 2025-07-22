"use client"

import { useState, useEffect } from "react"

export interface UserPermissions {
  roles: string[]
  permissions: string[]
  isAdmin: boolean
  isLoaded: boolean
}

// Test user types for demonstration
export const TEST_USERS = {
  admin: {
    roles: ["admin"],
    permissions: ["view_homes", "edit_homes", "manage_users", "view_admin"],
    isAdmin: true,
  },
  staff: {
    roles: ["staff"],
    permissions: ["view_homes"],
    isAdmin: false,
  },
  external: {
    roles: ["external"],
    permissions: ["view_profile"],
    isAdmin: false,
  },
  none: {
    roles: [],
    permissions: [],
    isAdmin: false,
  },
}

export function usePermissions(): UserPermissions {
  const [permissions, setPermissions] = useState<UserPermissions>({
    roles: [],
    permissions: [],
    isAdmin: false,
    isLoaded: false,
  })

  useEffect(() => {
    // For now, we'll use localStorage to simulate different user types
    // This will be replaced with actual Clerk integration later
    const testUserType = localStorage.getItem("test-user-type") || "staff"
    const userData = TEST_USERS[testUserType as keyof typeof TEST_USERS] || TEST_USERS.staff

    setPermissions({
      ...userData,
      isLoaded: true,
    })
  }, [])

  return permissions
}

export function setTestUser(userType: keyof typeof TEST_USERS) {
  localStorage.setItem("test-user-type", userType)
  window.location.reload()
}
