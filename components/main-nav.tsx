"use client"

import type React from "react"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

export function MainNav({ className, ...props }: React.HTMLAttributes<HTMLElement>) {
  const pathname = usePathname()

  return (
    <nav className={cn("flex items-center space-x-4 lg:space-x-6", className)} {...props}>
      <Link
        href="/dashboard"
        className={cn(
          "text-sm font-medium transition-colors hover:text-primary",
          pathname === "/dashboard" ? "text-foreground" : "text-muted-foreground",
        )}
      >
        Dashboard
      </Link>
      <Link
        href="/homes-list"
        className={cn(
          "text-sm font-medium transition-colors hover:text-primary",
          pathname === "/homes-list" ? "text-foreground" : "text-muted-foreground",
        )}
      >
        Homes List
      </Link>
      <Link
        href="/homes-map"
        className={cn(
          "text-sm font-medium transition-colors hover:text-primary",
          pathname === "/homes-map" ? "text-foreground" : "text-muted-foreground",
        )}
      >
        Homes Map
      </Link>
      <Link
        href="/visits-calendar"
        className={cn(
          "text-sm font-medium transition-colors hover:text-primary",
          pathname === "/visits-calendar" ? "text-foreground" : "text-muted-foreground",
        )}
      >
        Calendar
      </Link>
    </nav>
  )
}
