import { ClerkProvider } from "@clerk/nextjs"
import type React from "react"

export default function AuthTestLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <ClerkProvider>{children}</ClerkProvider>
}
