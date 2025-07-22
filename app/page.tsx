"use client"

import { CardDescription } from "@/components/ui/card"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function HomePage() {
  const router = useRouter()

  const handleSignIn = () => {
    router.push("/dashboard")
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
        <CardContent>
          <Button onClick={handleSignIn} className="w-full bg-refuge-purple hover:bg-refuge-purple/90" size="lg">
            Sign In
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
