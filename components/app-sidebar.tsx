import type React from "react"
import { Home } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { MainNav } from "@/components/main-nav"
import { MICROSERVICE_CONFIG } from "@/lib/microservice-config"

interface DashboardShellProps {
  children?: React.ReactNode
}

export const AppSidebar = ({ children }: DashboardShellProps) => {
  return (
    <div className="flex h-full flex-col border-r bg-secondary">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex flex-col items-start gap-2">
          <div className="flex items-center gap-2 px-4 py-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Home className="h-4 w-4" />
            </div>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-semibold">{MICROSERVICE_CONFIG.name}</span>
              {process.env.NODE_ENV === "development" && (
                <span className="truncate text-xs text-muted-foreground">{MICROSERVICE_CONFIG.code}</span>
              )}
            </div>
          </div>
        </div>
        <Separator />
        <MainNav className="flex flex-col gap-4" />
      </div>
    </div>
  )
}
