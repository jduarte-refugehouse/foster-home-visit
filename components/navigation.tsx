"use client"

import Link from "next/link"
import { Home, Users, Settings, PanelLeft, Package2, ShieldCheck, LayoutDashboard, Wrench } from "lucide-react"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { usePathname } from "next/navigation"
import { usePermissions } from "@/hooks/use-permissions"
import { UserButton, SignedIn, SignedOut, useUser } from "@clerk/nextjs"

export function Navigation() {
  const pathname = usePathname()
  const { hasPermission, isSystemAdmin } = usePermissions()
  const { user } = useUser()

  // Check if current user is system admin (jduarte@refugehouse.org)
  const isCurrentUserSystemAdmin = user?.primaryEmailAddress?.emailAddress === "jduarte@refugehouse.org"

  const getBreadcrumbs = () => {
    const segments = pathname.split("/").filter(Boolean)
    return (
      <Breadcrumb className="hidden md:flex">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/dashboard">Dashboard</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          {segments.map((segment, index) => {
            const href = "/" + segments.slice(0, index + 1).join("/")
            const isLast = index === segments.length - 1
            const name = segment.charAt(0).toUpperCase() + segment.slice(1)
            return (
              <BreadcrumbSeparator key={href}>
                <BreadcrumbItem>
                  {isLast ? (
                    <BreadcrumbPage>{name}</BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink asChild>
                      <Link href={href}>{name}</Link>
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
              </BreadcrumbSeparator>
            )
          })}
        </BreadcrumbList>
      </Breadcrumb>
    )
  }

  const navLinks = [
    {
      href: "/dashboard",
      icon: LayoutDashboard,
      label: "Dashboard",
      permission: "dashboard_view",
    },
    { href: "/homes-list", icon: Home, label: "Homes", permission: "home_view" },
    {
      href: "/admin/users",
      icon: Users,
      label: "User Management",
      permission: "user_manage",
    },
    {
      href: "/admin/roles",
      icon: ShieldCheck,
      label: "Role Management",
      permission: "system_config",
    },
    {
      href: "/diagnostics",
      icon: Settings,
      label: "Diagnostics",
      permission: "system_config",
    },
  ]

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-6 py-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-8">
      <Sheet>
        <SheetTrigger asChild>
          <Button size="icon" variant="outline" className="sm:hidden bg-transparent">
            <PanelLeft className="h-5 w-5" />
            <span className="sr-only">Toggle Menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="sm:max-w-xs p-6">
          <nav className="grid gap-6 text-lg font-medium">
            <Link
              href="#"
              className="group flex h-10 w-10 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:text-base"
            >
              <Package2 className="h-5 w-5 transition-all group-hover:scale-110" />
              <span className="sr-only">Refuge House</span>
            </Link>
            {navLinks.map(
              (link) =>
                (hasPermission(link.permission) || isSystemAdmin) && (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-4 px-2.5 ${
                      pathname === link.href ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <link.icon className="h-5 w-5" />
                    {link.label}
                  </Link>
                ),
            )}
            {/* System Admin Tools - Mobile */}
            {isCurrentUserSystemAdmin && (
              <Link
                href="/system-admin"
                className={`flex items-center gap-4 px-2.5 ${
                  pathname === "/system-admin" ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Wrench className="h-5 w-5" />
                System Admin
              </Link>
            )}
          </nav>
        </SheetContent>
      </Sheet>
      {getBreadcrumbs()}
      <div className="relative ml-auto flex-1 md:grow-0">{/* Search can go here if needed */}</div>
      <div className="ml-auto flex items-center gap-6">
        {/* System Admin Button - Desktop Only */}
        {isCurrentUserSystemAdmin && (
          <Link href="/system-admin">
            <Button
              variant="outline"
              size="sm"
              className="hidden sm:flex items-center gap-2 border-orange-500 text-orange-600 hover:bg-orange-500 hover:text-white dark:border-orange-400 dark:text-orange-400 dark:hover:bg-orange-400 dark:hover:text-gray-900 bg-transparent"
            >
              <Wrench className="h-4 w-4" />
              System Admin
            </Button>
          </Link>
        )}
        <SignedIn>
          <UserButton afterSignOutUrl="/" />
        </SignedIn>
        <SignedOut>
          <Button asChild variant="outline">
            <Link href="/sign-in">Sign In</Link>
          </Button>
        </SignedOut>
      </div>
    </header>
  )
}
