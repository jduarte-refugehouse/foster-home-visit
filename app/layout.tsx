import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import Image from "next/image"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Family Visits App",
  description: "Internal application for managing family visits.",
    generator: 'v0.dev'
}

const LOGO_SRC = "/images/web logo with name.png"

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={cn("min-h-screen bg-background font-sans antialiased", inter.variable)}>
        <header className="flex items-center justify-between px-4 py-2 border-b bg-white dark:bg-gray-800">
          <Link href="/" className="flex items-center gap-2">
            <Image src={LOGO_SRC || "/placeholder.svg"} alt="Family Visits App Logo" width={150} height={40} priority />
          </Link>
          <nav className="flex items-center gap-4">
            <Button variant="ghost" asChild>
              <Link href="/dashboard">Dashboard</Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link href="/homes-list">Homes List</Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link href="/homes-map">Homes Map</Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link href="/admin">Admin</Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link href="/diagnostics">Diagnostics</Link>
            </Button>
          </nav>
        </header>
        <main className="flex-1 p-4">{children}</main>
      </body>
    </html>
  )
}
