"use client"

import { useUser } from "@clerk/nextjs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { User, Shield, CheckCircle, AlertCircle } from "lucide-react"
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

interface UserInfoResponse {
  appUser: AppUser
  roles: UserRole[]
  permissions: UserPermission[]
}

export default function DashboardPage() {
  const { user } = useUser()
  const [userInfo, setUserInfo] = useState<UserInfoResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      fetchUserInfo()
    }
  }, [user])

  const fetchUserInfo = async () => {
    if (!user) return

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
        throw new Error(errorData.error || "Failed to fetch user info")
      }

      const data = await response.json()
      setUserInfo(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-refuge-purple"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <Card className="border-red-200">
          <CardContent className="py-6">
            <div className="flex items-center gap-3 text-red-600">
              <AlertCircle className="h-5 w-5" />
              <span className="font-medium">Error: {error}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-refuge-purple to-refuge-magenta bg-clip-text text-transparent">
          Dashboard
        </h1>
        <p className="text-refuge-dark-blue mt-2">Welcome to the Home Visits Service</p>
      </div>

      {/* User Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-refuge-purple">
            <User className="h-5 w-5" />
            User Information
          </CardTitle>
          <CardDescription>Your account details and status</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <span className="font-medium text-refuge-dark-blue">Name:</span>
              <p className="text-gray-600">
                {userInfo?.appUser.first_name} {userInfo?.appUser.last_name}
              </p>
            </div>
            <div>
              <span className="font-medium text-refuge-dark-blue">Email:</span>
              <p className="text-gray-600">{userInfo?.appUser.email}</p>
            </div>
            <div>
              <span className="font-medium text-refuge-dark-blue">Status:</span>
              <Badge variant={userInfo?.appUser.is_active ? "default" : "secondary"} className="ml-2">
                {userInfo?.appUser.is_active ? "Active" : "Inactive"}
              </Badge>
            </div>
            <div>
              <span className="font-medium text-refuge-dark-blue">Member Since:</span>
              <p className="text-gray-600">
                {userInfo?.appUser.created_at ? new Date(userInfo.appUser.created_at).toLocaleDateString() : "N/A"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Roles Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-refuge-purple">
            <Shield className="h-5 w-5" />
            Your Roles ({userInfo?.roles.length || 0})
          </CardTitle>
          <CardDescription>Roles assigned to your account</CardDescription>
        </CardHeader>
        <CardContent>
          {userInfo?.roles && userInfo.roles.length > 0 ? (
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

      {/* Permissions Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-refuge-purple">
            <CheckCircle className="h-5 w-5" />
            Your Permissions ({userInfo?.permissions.length || 0})
          </CardTitle>
          <CardDescription>What you can access in this application</CardDescription>
        </CardHeader>
        <CardContent>
          {userInfo?.permissions && userInfo.permissions.length > 0 ? (
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
    </div>
  )
}
