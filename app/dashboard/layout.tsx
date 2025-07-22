import type React from "react"
import { getAuth } from "@/lib/auth-utils"
import { redirect } from "next/navigation"
import { Navigation } from "@/components/navigation"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { userId } = await getAuth()
  if (!userId) {
    // This redirect will only be hit in production, as getAuth provides a mock userId in dev.
    redirect("/sign-in")
  }
  return (
    <>
      <Navigation />
      <div className="container mx-auto px-4 py-8">{children}</div>
    </>
  )
}
