"use client"

import { useUser } from "@clerk/nextjs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowLeft, User, Shield, CheckCircle, AlertCircle } from "lucide-react"
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
      <div className="p-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-refuge-purple"></div>
        </div>
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-refuge-purple to-refuge-magenta bg-clip-text text-transparent">
            Dashboard
          </h1>
          <p className="text-refuge-dark-blue mt-2">Welcome to your Home Visits Service dashboard</p>
        </div>
        <Link href="/">
          <Button
            variant="outline"
            className="border-refuge-purple text-refuge-purple hover:bg-refuge-purple hover:text-white bg-transparent"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Login
          </Button>
        </Link>
      </div>

      {userInfo && (
        <>
          {/* User Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-refuge-purple">
                <User className="h-5 w-5" />
                User Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-refuge-gray rounded-lg">
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="font-medium text-refuge-dark-blue">{userInfo.appUser.email}</p>
                </div>
                <div className="text-center p-4 bg-refuge-gray rounded-lg">
                  <p className="text-sm text-gray-600">User ID</p>
                  <p className="font-medium text-refuge-dark-blue font-mono text-xs">{userInfo.appUser.id}</p>
                </div>
                <div className="text-center p-4 bg-refuge-gray rounded-lg">
                  <p className="text-sm text-gray-600">Status</p>
                  <Badge variant={userInfo.appUser.is_active ? "default" : "secondary"}>
                    {userInfo.appUser.is_active ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Current Roles */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-refuge-purple">
                <Shield className="h-5 w-5" />
                Current Roles ({userInfo.roles.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {userInfo.roles.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {userInfo.roles.map((role, index) => (
                    <div key={index} className="p-4 bg-refuge-gray rounded-lg border-l-4 border-refuge-purple">
                      <h4 className="font-medium text-refuge-dark-blue">{role.role_name}</h4>
                      <p className="text-sm text-gray-600">in {role.app_name}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 italic text-center py-4">No roles assigned</p>
              )}
            </CardContent>
          </Card>

          {/* Current Permissions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-refuge-purple">
                <CheckCircle className="h-5 w-5" />
                Current Permissions ({userInfo.permissions.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {userInfo.permissions.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {userInfo.permissions.map((permission, index) => (
                    <div key={index} className="p-4 bg-refuge-gray rounded-lg border-l-4 border-refuge-magenta">
                      <h4 className="font-medium text-refuge-dark-blue">{permission.permission_name}</h4>
                      <p className="text-sm text-gray-600">
                        {permission.permission_code} • {permission.app_name}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500 font-medium">No permissions assigned</p>
                  <p className="text-sm text-gray-400 mt-1">Contact an administrator to request access</p>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
