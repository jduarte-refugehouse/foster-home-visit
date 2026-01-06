"use client"

import { useUser } from "@clerk/nextjs"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@refugehouse/shared-core/components/ui/card"
import { Badge } from "@refugehouse/shared-core/components/ui/badge"
import { AccountRegistrationRequired } from "@refugehouse/shared-core/components/account-registration-required"
import { useDatabaseAccess } from "@refugehouse/shared-core/hooks/use-database-access"
import { Home, User, Mail, IdCard, Calendar, Shield } from "lucide-react"
import { format } from "date-fns"

export default function MyHouseDashboardPage() {
  const { user, isLoaded } = useUser()
  const { hasAccess: hasDatabaseAccess, userInfo, isLoading: checkingDatabaseAccess } = useDatabaseAccess()

  // Show loading state
  if (!isLoaded || checkingDatabaseAccess) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-refuge-purple mx-auto mb-4"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Show registration required if no database access
  if (!hasDatabaseAccess) {
    return <AccountRegistrationRequired />
  }

  // Show sign-in required if no user
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-96">
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>Please sign in to access the MyHouse Portal</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  const fullName = `${user.firstName || ""} ${user.lastName || ""}`.trim() || "User"
  const email = user.emailAddresses[0]?.emailAddress || "No email"
  const userId = user.id
  const createdAt = user.createdAt ? new Date(user.createdAt) : null

  return (
    <div className="container mx-auto p-6 space-y-6 max-w-6xl">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-refuge-light-purple/10 via-refuge-purple/5 to-refuge-magenta/10 rounded-2xl p-8 border border-refuge-purple/20">
        <div className="flex items-center gap-4 mb-2">
          <div className="bg-gradient-to-br from-refuge-purple to-refuge-magenta p-3 rounded-xl">
            <Home className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-refuge-purple to-refuge-magenta bg-clip-text text-transparent">
              Welcome to MyHouse Portal
            </h1>
            <p className="text-slate-600 mt-1">
              Foster parent information and communication hub
            </p>
          </div>
        </div>
      </div>

      {/* User Profile Card */}
      <Card className="border-refuge-purple/20">
        <CardHeader className="bg-gradient-to-r from-refuge-purple/5 to-refuge-magenta/5">
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5 text-refuge-purple" />
            Your Profile
          </CardTitle>
          <CardDescription>Your account information and credentials</CardDescription>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          {/* Full Name */}
          <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-refuge-purple/5 transition-colors">
            <div className="bg-refuge-purple/10 p-2 rounded-lg mt-0.5">
              <User className="w-4 h-4 text-refuge-purple" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-500">Full Name</p>
              <p className="text-lg font-semibold text-slate-900">{fullName}</p>
            </div>
          </div>

          {/* Email Address */}
          <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-refuge-purple/5 transition-colors">
            <div className="bg-refuge-purple/10 p-2 rounded-lg mt-0.5">
              <Mail className="w-4 h-4 text-refuge-purple" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-500">Email Address</p>
              <p className="text-lg font-semibold text-slate-900">{email}</p>
            </div>
          </div>

          {/* User ID */}
          <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-refuge-purple/5 transition-colors">
            <div className="bg-refuge-purple/10 p-2 rounded-lg mt-0.5">
              <IdCard className="w-4 h-4 text-refuge-purple" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-500">User ID (Clerk)</p>
              <p className="text-sm font-mono text-slate-900 break-all">{userId}</p>
            </div>
          </div>

          {/* Account Created */}
          {createdAt && (
            <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-refuge-purple/5 transition-colors">
              <div className="bg-refuge-purple/10 p-2 rounded-lg mt-0.5">
                <Calendar className="w-4 h-4 text-refuge-purple" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-500">Account Created</p>
                <p className="text-lg font-semibold text-slate-900">
                  {format(createdAt, "MMMM d, yyyy 'at' h:mm a")}
                </p>
              </div>
            </div>
          )}

          {/* Database Access Status */}
          {userInfo && (
            <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-refuge-purple/5 transition-colors">
              <div className="bg-refuge-purple/10 p-2 rounded-lg mt-0.5">
                <Shield className="w-4 h-4 text-refuge-purple" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-500">Database Access</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                    Active
                  </Badge>
                  {userInfo.is_active && (
                    <Badge className="bg-refuge-purple/10 text-refuge-purple hover:bg-refuge-purple/10">
                      Verified User
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="border-refuge-purple/20 bg-gradient-to-br from-refuge-light-purple/5 to-refuge-magenta/5">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <div className="bg-refuge-purple/10 p-2 rounded-lg mt-0.5">
              <Home className="w-5 h-5 text-refuge-purple" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 mb-2">Welcome to MyHouse Portal</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                This is your personal portal for accessing foster care resources, communicating with case workers, 
                and managing important documents. This dashboard displays your account information securely 
                retrieved from our authentication system.
              </p>
              <p className="text-slate-600 text-sm leading-relaxed mt-3">
                Additional features will be added soon, including document access, messaging, and resource library.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Development Info Card */}
      <Card className="border-amber-200 bg-amber-50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <div className="bg-amber-100 p-2 rounded-lg mt-0.5">
              <Shield className="w-5 h-5 text-amber-700" />
            </div>
            <div>
              <h3 className="font-semibold text-amber-900 mb-2">Development Template</h3>
              <p className="text-amber-700 text-sm leading-relaxed">
                This microservice serves as a template for future Refuge House applications. It demonstrates:
              </p>
              <ul className="text-amber-700 text-sm space-y-1 mt-2 ml-4 list-disc">
                <li>Clerk authentication integration</li>
                <li>Database access verification</li>
                <li>Branded UI components and styling</li>
                <li>User credential display</li>
                <li>Microservice configuration</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

