"use client"

import type React from "react"
import { useUser } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { isLoaded, isSignedIn } = useUser()
  const router = useRouter()

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push("/")
    }
  }, [isLoaded, isSignedIn, router])

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-refuge-gray flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-refuge-purple"></div>
      </div>
    )
  }

  if (!isSignedIn) {
    return null
  }

  return <div className="min-h-screen bg-refuge-gray">{children}</div>
}
