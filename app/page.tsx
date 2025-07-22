"use client"

import { useUser, SignInButton, SignOutButton } from "@clerk/nextjs"
import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, CheckCircle, User, Shield, Database } from "lucide-react"
import Image from "next/image"

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

interface UserInfoResponse {
  appUser: AppUser
  roles: UserRole[]
  permissions: UserPermission[]
  error?: string
  requiresInvitation?: boolean
}

export default function HomePage() {
  const { isSignedIn, user, isLoaded } = useUser()
  const [userInfo, setUserInfo] = useState<UserInfoResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isSignedIn && user && isLoaded) {
      fetchUserInfo()
    } else if (!isSignedIn && isLoaded) {
      setUserInfo(null)
      setError(null)
    }
  }, [isSignedIn, user, isLoaded])

  const fetchUserInfo = async () => {
    if (!user) return

    setLoading(true)
    setError(null)

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

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Failed to fetch user information")
        if (data.requiresInvitation) {
          setError("Access denied. External users require an invitation to join.")
        }
        return
      }

      setUserInfo(data)
    } catch (err) {
      setError("Network error occurred")
      console.error("Error fetching user info:", err)
    } finally {
      setLoading(false)
    }
  }

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-refuge-gray flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-refuge-purple"></div>
      </div>
    )
  }

  if (!isSignedIn) {
    return (
      <div className="min-h-screen bg-refuge-gray flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center space-y-4">
            <div className="flex justify-center">
              <Image
                src="/images/web logo with name.png"
                alt="Refuge House Logo"
                width={300}
                height={120}
                className="object-contain"
              />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-refuge-purple to-refuge-magenta bg-clip-text text-transparent">
                Home Visits Service
              </CardTitle>
              <CardDescription className="text-refuge-dark-blue mt-2">Please sign in to continue</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <SignInButton mode="modal">
              <Button className="w-full bg-refuge-purple hover:bg-refuge-light-purple text-white">Sign In</Button>
            </SignInButton>
            <div className="text-center text-sm text-gray-600">
              Don't have an account?{" "}
              <SignInButton mode="modal">
                <button className="text-refuge-purple hover:text-refuge-magenta font-medium">Sign up here</button>
              </SignInButton>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-refuge-gray p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Image
                  src="/images/web logo with name.png"
                  alt="Refuge House Logo"
                  width={200}
                  height={80}
                  className="object-contain"
                />
                <div>
                  <CardTitle className="text-xl bg-gradient-to-r from-refuge-purple to-refuge-magenta bg-clip-text text-transparent">
                    Authentication Test - Success!
                  </CardTitle>
                  <CardDescription>Clerk integration working with database</CardDescription>
                </div>
              </div>
              <SignOutButton>
                <Button
                  variant="outline"
                  className="border-refuge-purple text-refuge-purple hover:bg-refuge-purple hover:text-white bg-transparent"
                >
                  Sign Out
                </Button>
              </SignOutButton>
            </div>
          </CardHeader>
        </Card>

        {/* Loading State */}
        {loading && (
          <Card>
            <CardContent className="flex items-center justify-center py-8">
              <div className="flex items-center gap-3">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-refuge-purple"></div>
                <span className="text-refuge-dark-blue">Loading user information...</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error State */}
        {error && (
          <Card className="border-red-200">
            <CardContent className="py-6">
              <div className="flex items-center gap-3 text-red-600">
                <AlertCircle className="h-5 w-5" />
                <span className="font-medium">Error: {error}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Success State */}
        {userInfo && !loading && (
          <>
            {/* Clerk User Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-refuge-purple">
                  <User className="h-5 w-5" />
                  Clerk User Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="font-medium text-refuge-dark-blue">User ID:</span>
                    <p className="text-sm text-gray-600 font-mono">{user?.id}</p>
                  </div>
                  <div>
                    <span className="font-medium text-refuge-dark-blue">Email:</span>
                    <p className="text-sm text-gray-600">{user?.primaryEmailAddress?.emailAddress}</p>
                  </div>
                  <div>
                    <span className="font-medium text-refuge-dark-blue">First Name:</span>
                    <p className="text-sm text-gray-600">{user?.firstName || "Not provided"}</p>
                  </div>
                  <div>
                    <span className="font-medium text-refuge-dark-blue">Last Name:</span>
                    <p className="text-sm text-gray-600">{user?.lastName || "Not provided"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Database User Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-refuge-purple">
                  <Database className="h-5 w-5" />
                  Database User Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="font-medium text-refuge-dark-blue">App User ID:</span>
                    <p className="text-sm text-gray-600 font-mono">{userInfo.appUser.id}</p>
                  </div>
                  <div>
                    <span className="font-medium text-refuge-dark-blue">Status:</span>
                    <Badge variant={userInfo.appUser.is_active ? "default" : "secondary"} className="ml-2">
                      {userInfo.appUser.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <div>
                    <span className="font-medium text-refuge-dark-blue">Created:</span>
                    <p className="text-sm text-gray-600">
                      {new Date(userInfo.appUser.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium text-refuge-dark-blue">Updated:</span>
                    <p className="text-sm text-gray-600">
                      {new Date(userInfo.appUser.updated_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Roles */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-refuge-purple">
                  <Shield className="h-5 w-5" />
                  User Roles ({userInfo.roles.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {userInfo.roles.length > 0 ? (
                  <div className="space-y-2">
                    {userInfo.roles.map((role, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-refuge-gray rounded-lg">
                        <div>
                          <span className="font-medium text-refuge-dark-blue">{role.role_name}</span>
                          <p className="text-sm text-gray-600">in {role.app_name}</p>
                        </div>
                        <Badge variant="outline" className="border-refuge-purple text-refuge-purple">
                          Role
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 italic">No roles assigned</p>
                )}
              </CardContent>
            </Card>

            {/* Permissions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-refuge-purple">
                  <CheckCircle className="h-5 w-5" />
                  User Permissions ({userInfo.permissions.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {userInfo.permissions.length > 0 ? (
                  <div className="space-y-2">
                    {userInfo.permissions.map((permission, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-refuge-gray rounded-lg">
                        <div>
                          <span className="font-medium text-refuge-dark-blue">{permission.permission_name}</span>
                          <p className="text-sm text-gray-600">
                            {permission.permission_code} in {permission.app_name}
                          </p>
                        </div>
                        <Badge variant="outline" className="border-refuge-magenta text-refuge-magenta">
                          Permission
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-500 font-medium">No permissions assigned</p>
                    <p className="text-sm text-gray-400 mt-1">Contact an administrator to request access</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  )
}
