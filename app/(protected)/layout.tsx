import type React from "react"
import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { AppHeader } from "@/components/app-header"
import { ImpersonationBanner } from "@/components/impersonation-banner"
import { AccessGuard } from "@/components/access-guard"

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AccessGuard>
      <SidebarProvider>
        <div className="flex min-h-screen w-full">
          <AppSidebar />
          <div className="flex-1 flex flex-col">
            <ImpersonationBanner />
            <AppHeader />
            <main className="flex-1 overflow-auto">{children}</main>
          </div>
        </div>
      </SidebarProvider>
    </AccessGuard>
  )
}
