"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Home, Map, Users, Settings, TestTube } from "lucide-react"
import { ProtectedContent } from "./protected-content"
import { usePermissions, setTestUser } from "@/hooks/use-permissions"

export function Navigation() {
  const pathname = usePathname()
  const { roles, permissions, isAdmin, isLoaded } = usePermissions()

  const navItems = [
    {
      href: "/dashboard",
      label: "Dashboard",
      icon: Home,
      requiredPermissions: [],
    },
    {
      href: "/homes-list",
      label: "Homes List",
      icon: Home,
      requiredPermissions: ["view_homes"],
    },
    {
      href: "/homes-map",
      label: "Homes Map",
      icon: Map,
      requiredPermissions: ["view_homes"],
    },
    {
      href: "/admin",
      label: "Admin",
      icon: Settings,
      requiredRoles: ["admin"],
    },
    {
      href: "/auth-test",
      label: "Auth Test",
      icon: TestTube,
      requiredPermissions: [],
    },
  ]

  const getCurrentUserType = () => {
    if (isAdmin) return "admin"
    if (permissions.includes("view_homes")) return "staff"
    if (roles.length > 0) return "external"
    return "none"
  }

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <Image src="/images/House Only.png" alt="Refuge House" width={32} height={32} className="h-8 w-8" />
            <span className="font-bold text-xl">Home Visits</span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-6">
            {navItems.map((item) => (
              <ProtectedContent
                key={item.href}
                requiredPermissions={item.requiredPermissions}
                requiredRoles={item.requiredRoles}
              >
                <Link
                  href={item.href}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    pathname === item.href
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              </ProtectedContent>
            ))}
          </div>

          {/* User Info and Test Controls */}
          <div className="flex items-center space-x-4">
            {isLoaded && (
              <div className="flex items-center space-x-2">
                <Badge variant="outline">
                  {getCurrentUserType().charAt(0).toUpperCase() + getCurrentUserType().slice(1)}
                </Badge>

                {/* Test User Switcher */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      Test as...
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setTestUser("admin")}>
                      <Settings className="mr-2 h-4 w-4" />
                      Administrator
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setTestUser("staff")}>
                      <Users className="mr-2 h-4 w-4" />
                      Refuge House Staff
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setTestUser("external")}>
                      <Home className="mr-2 h-4 w-4" />
                      External User
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setTestUser("none")}>
                      <TestTube className="mr-2 h-4 w-4" />
                      No Permissions
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
