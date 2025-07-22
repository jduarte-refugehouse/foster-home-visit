"use client"

import { useUser, SignInButton, SignUpButton } from "@clerk/nextjs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function HomePage() {
  const { isLoaded, isSignedIn, user } = useUser()
  const router = useRouter()

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.push("/dashboard")
    }
  }, [isLoaded, isSignedIn, router])

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-refuge-gray dark:bg-gray-900 p-4">
        <Card className="w-full max-w-sm shadow-xl">
          <CardContent className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-refuge-purple"></div>
            <span className="ml-2">Loading...</span>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-refuge-gray dark:bg-gray-900 p-4">
      <Card className="w-full max-w-sm shadow-xl">
        <CardHeader className="text-center">
          <Image
            src="/images/web logo with name.png"
            alt="Refuge House Logo"
            width={250}
            height={94}
            className="mx-auto mb-4"
            priority
          />
          <CardTitle className="text-2xl font-semibold tracking-tight bg-gradient-to-r from-refuge-purple to-refuge-magenta bg-clip-text text-transparent">
            Home Visits Service
          </CardTitle>
          <CardDescription className="text-sm text-gray-600 dark:text-gray-400">
            Please sign in to continue
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <SignInButton mode="modal" afterSignInUrl="/dashboard" afterSignUpUrl="/dashboard">
            <Button className="w-full bg-refuge-purple hover:bg-refuge-purple/90" size="lg">
              Sign In
            </Button>
          </SignInButton>

          <div className="text-center text-sm text-gray-500">
            Don't have an account?{" "}
            <SignUpButton mode="modal" afterSignInUrl="/dashboard" afterSignUpUrl="/dashboard">
              <button className="text-refuge-purple hover:text-refuge-purple/90 font-medium">Sign up here</button>
            </SignUpButton>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
