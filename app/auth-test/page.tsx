"use client"

import { useUser, useAuth, SignInButton, SignUpButton, SignOutButton } from "@clerk/nextjs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  User,
  LogIn,
  UserPlus,
  LogOut,
  Shield,
  Mail,
  Calendar,
  Key,
  Database,
  Users,
  Lock,
  AlertTriangle,
} from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"

interface AppUser {
  id: string
  clerk_user_id: string
  email: string
  first_name: string
  last_name: string
  is_active: boolean
  created_at: string
  updated_at: string
}

interface UserRole {
  role_name: string
  app_name: string
}

interface UserPermission {
  permission_code: string
  permission_name: string
  app_name: string
}

interface DatabaseUserInfo {
  appUser: AppUser
  roles: UserRole[]
  permissions: UserPermission[]
}

export default function AuthTestPage() {
  const { isLoaded, isSignedIn, user } = useUser()
  const { signOut } = useAuth()
  const [dbUserInfo, setDbUserInfo] = useState<DatabaseUserInfo | null>(null)
  const [dbLoading, setDbLoading] = useState(false)
  const [dbError, setDbError] = useState<string | null>(null)
  const [requiresInvitation, setRequiresInvitation] = useState(false)

  // Fetch database user info when user signs in
  useEffect(() => {
    if (isSignedIn && user) {
      fetchDatabaseUserInfo()
    } else {
      setDbUserInfo(null)
      setDbError(null)
      setRequiresInvitation(false)
    }
  }, [isSignedIn, user])

  const fetchDatabaseUserInfo = async () => {
    if (!user) return

    setDbLoading(true)
    setDbError(null)
    setRequiresInvitation(false)

    try {
      const response = await fetch("/api/auth-test/user-info", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          clerkUserId: user.id,
          email: user.primaryEmailAddress?.emailAddress,
          firstName: user.firstName,
          lastName: user.lastName,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        if (response.status === 403 && errorData.requiresInvitation) {
          setRequiresInvitation(true)
        }
        throw new Error(errorData.error || "Failed to fetch user info")
      }

      const data = await response.json()
      setDbUserInfo(data)
    } catch (error) {
      console.error("Error fetching database user info:", error)
      setDbError(error instanceof Error ? error.message : "Unknown error")
    } finally {
      setDbLoading(false)
    }
  }

  const getUserTypeInfo = (email: string | undefined) => {
    if (!email) return { type: "Unknown", description: "No email available" }

    if (email === "jduarte@refugehouse.org") {
      return {
        type: "Global Admin",
        description: "Full system access with all permissions",
        color: "bg-red-100 text-red-800 border-red-200",
      }
    } else if (email.endsWith("@refugehouse.org")) {
      return {
        type: "Staff Member",
        description: "Refuge House staff with view_homes access only",
        color: "bg-blue-100 text-blue-800 border-blue-200",
      }
    } else {
      return {
        type: "External User",
        description: "Requires invitation and manual permission grants",
        color: "bg-orange-100 text-orange-800 border-orange-200",
      }
    }
  }

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2">Loading authentication...</span>
          </CardContent>
        </Card>
      </div>
    )
  }

  const userTypeInfo = getUserTypeInfo(user?.primaryEmailAddress?.emailAddress)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">🔐 Clerk Authentication Test</h1>
          <p className="text-gray-600">Isolated testing environment for authentication functionality</p>
          <Link href="/">
            <Button variant="outline" className="mt-2 bg-transparent">
              ← Back to Main App
            </Button>
          </Link>
        </div>

        {/* Invitation Required Warning */}
        {requiresInvitation && (
          <Card className="border-orange-200 bg-orange-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
                <div>
                  <h4 className="font-medium text-orange-800">Invitation Required</h4>
                  <p className="text-sm text-orange-700">
                    External users need an invitation to access the system. Please contact an administrator.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Authentication Status Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Clerk Authentication
              </CardTitle>
              <CardDescription>Current authentication state and user information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="font-medium">Status:</span>
                <Badge variant={isSignedIn ? "default" : "secondary"}>
                  {isSignedIn ? "Signed In" : "Not Signed In"}
                </Badge>
              </div>

              {isSignedIn && user && (
                <div className="space-y-3 pt-4 border-t">
                  <h4 className="font-medium flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Clerk User Info
                  </h4>

                  <div className="grid gap-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">User ID:</span>
                      <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">{user.id}</span>
                    </div>

                    {user.firstName && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">First Name:</span>
                        <span>{user.firstName}</span>
                      </div>
                    )}

                    {user.lastName && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Last Name:</span>
                        <span>{user.lastName}</span>
                      </div>
                    )}

                    {user.primaryEmailAddress && (
                      <div className="flex justify-between">
                        <span className="text-gray-600 flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          Email:
                        </span>
                        <span>{user.primaryEmailAddress.emailAddress}</span>
                      </div>
                    )}

                    <div className="flex justify-between">
                      <span className="text-gray-600 flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Created:
                      </span>
                      <span>{new Date(user.createdAt!).toLocaleDateString()}</span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-gray-600">Last Sign In:</span>
                      <span>{user.lastSignInAt ? new Date(user.lastSignInAt).toLocaleDateString() : "Never"}</span>
                    </div>
                  </div>

                  {/* User Type Badge */}
                  <div className={`p-3 rounded-lg border ${userTypeInfo.color}`}>
                    <div className="font-medium">{userTypeInfo.type}</div>
                    <div className="text-sm mt-1">{userTypeInfo.description}</div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Database User Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Database User Info
              </CardTitle>
              <CardDescription>App user record and database connection</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!isSignedIn ? (
                <div className="text-center text-gray-500 py-4">Sign in to view database user information</div>
              ) : dbLoading ? (
                <div className="flex items-center justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  <span className="ml-2 text-sm">Loading database info...</span>
                </div>
              ) : dbError ? (
                <div className="text-center py-4">
                  <div className="text-red-600 text-sm mb-2">Database Error:</div>
                  <div className="text-xs text-gray-600 bg-red-50 p-2 rounded">{dbError}</div>
                  {!requiresInvitation && (
                    <Button onClick={fetchDatabaseUserInfo} size="sm" className="mt-2">
                      Retry
                    </Button>
                  )}
                </div>
              ) : dbUserInfo ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Database Status:</span>
                    <Badge variant="default">Connected</Badge>
                  </div>

                  <div className="pt-2 border-t">
                    <h4 className="font-medium mb-2">App User Record</h4>
                    <div className="grid gap-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">App User ID:</span>
                        <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">{dbUserInfo.appUser.id}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Email:</span>
                        <span>{dbUserInfo.appUser.email}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Active:</span>
                        <Badge variant={dbUserInfo.appUser.is_active ? "default" : "secondary"}>
                          {dbUserInfo.appUser.is_active ? "Yes" : "No"}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Created:</span>
                        <span>{new Date(dbUserInfo.appUser.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-500 py-4">No database info available</div>
              )}
            </CardContent>
          </Card>

          {/* Authentication Actions Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                Authentication Actions
              </CardTitle>
              <CardDescription>Test sign in, sign up, and sign out functionality</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!isSignedIn ? (
                <div className="space-y-3">
                  <SignInButton mode="modal">
                    <Button className="w-full" size="lg">
                      <LogIn className="h-4 w-4 mr-2" />
                      Sign In
                    </Button>
                  </SignInButton>

                  <SignUpButton mode="modal">
                    <Button variant="outline" className="w-full bg-transparent" size="lg">
                      <UserPlus className="h-4 w-4 mr-2" />
                      Sign Up
                    </Button>
                  </SignUpButton>

                  <div className="text-center text-sm text-gray-500">Click either button to test authentication</div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="text-green-800 font-medium">✅ Authentication Successful!</div>
                    <div className="text-green-600 text-sm mt-1">You are successfully signed in with Clerk</div>
                  </div>

                  <SignOutButton>
                    <Button variant="destructive" className="w-full" size="lg">
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign Out
                    </Button>
                  </SignOutButton>

                  {dbUserInfo && (
                    <Button
                      onClick={fetchDatabaseUserInfo}
                      variant="outline"
                      className="w-full bg-transparent"
                      size="sm"
                    >
                      <Database className="h-4 w-4 mr-2" />
                      Refresh DB Info
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Roles and Permissions Cards */}
        {isSignedIn && dbUserInfo && (
          <div className="grid gap-6 md:grid-cols-2">
            {/* User Roles Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  User Roles
                </CardTitle>
                <CardDescription>Assigned roles across microservices</CardDescription>
              </CardHeader>
              <CardContent>
                {dbUserInfo.roles.length > 0 ? (
                  <div className="space-y-2">
                    {dbUserInfo.roles.map((role, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-blue-50 rounded">
                        <span className="font-medium">{role.role_name}</span>
                        <Badge variant="outline">{role.app_name}</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-gray-500 py-4">No roles assigned</div>
                )}
              </CardContent>
            </Card>

            {/* User Permissions Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  User Permissions
                </CardTitle>
                <CardDescription>Granted permissions across microservices</CardDescription>
              </CardHeader>
              <CardContent>
                {dbUserInfo.permissions.length > 0 ? (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {dbUserInfo.permissions.map((permission, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-green-50 rounded text-sm">
                        <div>
                          <div className="font-medium">{permission.permission_name}</div>
                          <div className="text-xs text-gray-600">{permission.permission_code}</div>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {permission.app_name}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-gray-500 py-4">
                    <div>No permissions assigned</div>
                    {user?.primaryEmailAddress?.emailAddress &&
                      !user.primaryEmailAddress.emailAddress.endsWith("@refugehouse.org") && (
                        <div className="text-xs text-orange-600 mt-1">
                          External users require manual permission grants
                        </div>
                      )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Debug Information Card */}
        <Card>
          <CardHeader>
            <CardTitle>🔍 Debug Information</CardTitle>
            <CardDescription>Technical details for debugging authentication issues</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <h4 className="font-medium mb-2">Environment Variables</h4>
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span>Publishable Key:</span>
                    <Badge variant="outline">
                      {process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ? "✅ Set" : "❌ Missing"}
                    </Badge>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Clerk State</h4>
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span>Is Loaded:</span>
                    <Badge variant={isLoaded ? "default" : "secondary"}>{isLoaded ? "Yes" : "No"}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Is Signed In:</span>
                    <Badge variant={isSignedIn ? "default" : "secondary"}>{isSignedIn ? "Yes" : "No"}</Badge>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Database State</h4>
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span>DB Connected:</span>
                    <Badge variant={dbUserInfo ? "default" : "secondary"}>{dbUserInfo ? "Yes" : "No"}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>User Created:</span>
                    <Badge variant={dbUserInfo?.appUser ? "default" : "secondary"}>
                      {dbUserInfo?.appUser ? "Yes" : "No"}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            {isSignedIn && user && (
              <div className="mt-4 pt-4 border-t">
                <h4 className="font-medium mb-2">Raw Clerk User Object (for debugging)</h4>
                <pre className="text-xs bg-gray-100 p-3 rounded overflow-auto max-h-40">
                  {JSON.stringify(
                    {
                      id: user.id,
                      firstName: user.firstName,
                      lastName: user.lastName,
                      emailAddresses: user.emailAddresses?.map((email) => ({
                        emailAddress: email.emailAddress,
                        verified: email.verification?.status,
                      })),
                      createdAt: user.createdAt,
                      lastSignInAt: user.lastSignInAt,
                    },
                    null,
                    2,
                  )}
                </pre>
              </div>
            )}

            {dbUserInfo && (
              <div className="mt-4 pt-4 border-t">
                <h4 className="font-medium mb-2">Raw Database User Object (for debugging)</h4>
                <pre className="text-xs bg-gray-100 p-3 rounded overflow-auto max-h-40">
                  {JSON.stringify(dbUserInfo, null, 2)}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Instructions Card */}
        <Card>
          <CardHeader>
            <CardTitle>📋 Testing Instructions & Permission Rules</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Testing Steps:</h4>
                <div className="space-y-2 text-sm">
                  <p>
                    <strong>1. Sign Up:</strong> Click "Sign Up" to create a new account
                  </p>
                  <p>
                    <strong>2. Sign In:</strong> Click "Sign In" to authenticate with existing credentials
                  </p>
                  <p>
                    <strong>3. View User Info:</strong> Once signed in, both Clerk and database user details will appear
                  </p>
                  <p>
                    <strong>4. Check Roles & Permissions:</strong> View assigned roles and permissions based on email
                  </p>
                  <p>
                    <strong>5. Sign Out:</strong> Click "Sign Out" to end the session
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t">
                <h4 className="font-medium mb-2">Permission Rules:</h4>
                <div className="space-y-2 text-sm">
                  <div className="p-2 bg-red-50 rounded border border-red-200">
                    <strong className="text-red-800">jduarte@refugehouse.org:</strong> Global Admin with all permissions
                  </div>
                  <div className="p-2 bg-blue-50 rounded border border-blue-200">
                    <strong className="text-blue-800">@refugehouse.org users:</strong> Staff role with view_homes
                    permission only
                  </div>
                  <div className="p-2 bg-orange-50 rounded border border-orange-200">
                    <strong className="text-orange-800">External users:</strong> Require invitation + manual permission
                    grants
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
