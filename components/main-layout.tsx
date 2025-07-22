"use client"

import type React from "react"

import { usePathname } from "next/navigation"
import { Navigation } from "./navigation"

export function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isHomePage = pathname === "/"

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      {!isHomePage && <Navigation />}
      <main className="flex-1">{children}</main>
    </div>
  )
}
