import type React from "react"
import { Navigation } from "@/components/navigation"

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto">{children}</main>
    </div>
  )
}
