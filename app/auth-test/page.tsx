"use client"

import { useUser, useAuth, SignInButton, SignUpButton, SignOutButton } from "@clerk/nextjs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { User, LogIn, UserPlus, LogOut, Shield, Mail, Calendar, Key } from "lucide-react"
import Link from "next/link"

export default function AuthTestPage() {
  const { isLoaded, isSignedIn, user } = useUser()
  const { signOut } = useAuth()

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
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

        <div className="grid gap-6 md:grid-cols-2">
          {/* Authentication Status Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Authentication Status
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
                    User Information
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
                </div>
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
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Debug Information Card */}
        <Card>
          <CardHeader>
            <CardTitle>🔍 Debug Information</CardTitle>
            <CardDescription>Technical details for debugging authentication issues</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
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
            </div>

            {isSignedIn && user && (
              <div className="mt-4 pt-4 border-t">
                <h4 className="font-medium mb-2">Raw User Object (for debugging)</h4>
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
          </CardContent>
        </Card>

        {/* Instructions Card */}
        <Card>
          <CardHeader>
            <CardTitle>📋 Testing Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <p>
                <strong>1. Sign Up:</strong> Click "Sign Up" to create a new account
              </p>
              <p>
                <strong>2. Sign In:</strong> Click "Sign In" to authenticate with existing credentials
              </p>
              <p>
                <strong>3. View User Info:</strong> Once signed in, user details will appear above
              </p>
              <p>
                <strong>4. Sign Out:</strong> Click "Sign Out" to end the session
              </p>
              <p>
                <strong>5. Debug:</strong> Check the debug section for troubleshooting
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
