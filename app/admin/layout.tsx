import type React from "react"
import { redirect } from "next/navigation"
import { getAuth } from "@/lib/auth-utils"
import { Navigation } from "@/components/navigation"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { userId } = await getAuth()

  if (!userId) {
    // In a real app, you might redirect. In dev, this check passes with mock data.
    // In prod, Clerk's middleware handles the redirect before this even runs.
    // Adding a redirect here for server-side protection as a fallback.
    if (process.env.CLERK_SECRET_KEY) {
      redirect("/sign-in")
    }
  }

  return (
    <div>
      <Navigation />
      <main>{children}</main>
    </div>
  )
}
