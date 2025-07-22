import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import type React from "react"

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { userId } = auth()

  if (!userId) {
    redirect("/sign-in")
  }

  return <>{children}</>
}
