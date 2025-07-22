"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Home, BookOpen, User, Plus, Shield } from "lucide-react"

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: Home },
  { name: "Resource Library", href: "/resources", icon: BookOpen },
  { name: "Profile", href: "/profile", icon: User },
]

const adminNavigation = [
  { name: "Admin Dashboard", href: "/admin", icon: Shield },
  { name: "Create Resource", href: "/admin/create", icon: Plus },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="hidden border-r bg-white lg:block dark:bg-gray-900/40">
      <div className="flex h-full max-h-screen flex-col gap-2">
        <div className="flex h-16 items-center border-b px-6">
          <Link className="flex items-center gap-2 font-semibold" href="/dashboard">
            <Image src="/images/House Only.png" alt="Refuge House" width={32} height={32} className="h-8 w-8" />
            <span className="text-lg">REFUGE HOUSE</span>
          </Link>
        </div>
        <div className="flex-1 overflow-auto py-2">
          <nav className="grid items-start px-4 text-sm font-medium">
            <div className="mb-4">
              <h3 className="mb-2 px-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Navigation</h3>
              {navigation.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-gray-500 transition-all hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50",
                      pathname === item.href && "bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-50",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.name}
                  </Link>
                )
              })}
            </div>
            <div>
              <h3 className="mb-2 px-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Administration</h3>
              {adminNavigation.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-gray-500 transition-all hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50",
                      pathname === item.href && "bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-50",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.name}
                  </Link>
                )
              })}
            </div>
          </nav>
        </div>
      </div>
    </div>
  )
}
