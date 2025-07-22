import { Navigation } from "@/components/navigation"
import type { ReactNode } from "react"

export default function ProtectedLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-muted/40">
      <Navigation />
      <main className="flex-1 p-4 sm:px-6 sm:py-0 md:gap-8">{children}</main>
    </div>
  )
}
