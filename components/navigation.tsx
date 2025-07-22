"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Home, Calendar, FileText, Users, Settings, TestTube, MapPin, ClipboardList } from "lucide-react"
import { usePermissions, setTestUser, TEST_USERS, getCurrentTestUser } from "@/hooks/use-permissions"

export function Navigation() {
  const pathname = usePathname()
  const permissions = usePermissions()
  const currentTestUser = getCurrentTestUser()

  const navItems = [
    {
      href: "/dashboard",
      label: "Dashboard",
      icon: Home,
      requiredPermissions: ["dashboard_view"],
      description: "Main dashboard",
    },
    {
      href: "/homes-list",
      label: "Homes",
      icon: Home,
      requiredPermissions: ["home_view"],
      description: "Foster & adoptive homes",
    },
    {
      href: "/homes-map",
      label: "Map",
      icon: MapPin,
      requiredPermissions: ["home_view"],
      description: "Geographic view",
    },
    {
      href: "/scheduling",
      label: "Scheduling",
      icon: Calendar,
      requiredPermissions: ["schedule_create", "schedule_view_all"],
      description: "Visit scheduling",
      requiresAny: true, // User needs ANY of the permissions, not all
    },
    {
      href: "/visits",
      label: "Visits",
      icon: ClipboardList,
      requiredPermissions: ["visit_conduct", "visit_report_view"],
      description: "Home visits & reports",
      requiresAny: true,
    },
    {
      href: "/cases",
      label: "Cases",
      icon: FileText,
      requiredPermissions: ["case_view_assigned", "case_view_all"],
      description: "Case management",
      requiresAny: true,
    },
    {
      href: "/quality-assurance",
      label: "QA",
      icon: Settings,
      requiredPermissions: ["qa_review_all"],
      description: "Quality assurance",
    },
    {
      href: "/admin",
      label: "Admin",
      icon: Users,
      requiredPermissions: ["user_manage"],
      description: "User management",
    },
  ]

  const canAccessNavItem = (item: (typeof navItems)[0]): boolean => {
    if (!permissions.isLoaded) return false

    if (permissions.isSystemAdmin) return true

    if (item.requiresAny) {
      return item.requiredPermissions.some((perm) => permissions.hasPermission(perm))
    }

    return item.requiredPermissions.every((perm) => permissions.hasPermission(perm))
  }

  const getUserDisplayInfo = () => {
    const userData = TEST_USERS[currentTestUser]
    const primaryRole = userData.roles[0]?.roleDisplayName || "No Role"

    return {
      name: userData.email.split("@")[0],
      email: userData.email,
      role: primaryRole,
      roleLevel: userData.roles[0]?.roleLevel || 0,
    }
  }

  const userInfo = getUserDisplayInfo()

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
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const hasAccess = canAccessNavItem(item)

              if (!hasAccess) return null

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    pathname === item.href
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  }`}
                  title={item.description}
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              )
            })}

            {/* Always show auth test */}
            <Link
              href="/auth-test"
              className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                pathname === "/auth-test"
                  ? "bg-orange-100 text-orange-700"
                  : "text-orange-600 hover:text-orange-700 hover:bg-orange-50"
              }`}
            >
              <TestTube className="h-4 w-4" />
              <span>Auth Test</span>
            </Link>
          </div>

          {/* User Info and Controls */}
          <div className="flex items-center space-x-4">
            {permissions.isLoaded && (
              <div className="flex items-center space-x-3">
                {/* User Role Badge */}
                <div className="flex items-center space-x-2">
                  <Badge
                    variant={
                      permissions.isSystemAdmin ? "destructive" : permissions.isAgencyAdmin ? "default" : "secondary"
                    }
                  >
                    {userInfo.role}
                  </Badge>
                  {userInfo.roleLevel >= 3 && (
                    <Badge variant="outline" className="text-xs">
                      Level {userInfo.roleLevel}
                    </Badge>
                  )}
                </div>

                {/* User Switcher for Testing */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      {userInfo.name}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-64">
                    <div className="px-3 py-2 text-sm">
                      <div className="font-medium">{userInfo.email}</div>
                      <div className="text-muted-foreground">{userInfo.role}</div>
                    </div>
                    <DropdownMenuSeparator />

                    <div className="px-3 py-1 text-xs font-medium text-muted-foreground">Test as different users:</div>

                    <DropdownMenuItem onClick={() => setTestUser("jduarte")}>
                      <Settings className="mr-2 h-4 w-4" />
                      <div>
                        <div className="font-medium">Jorge Duarte</div>
                        <div className="text-xs text-muted-foreground">System Admin</div>
                      </div>
                    </DropdownMenuItem>

                    <DropdownMenuItem onClick={() => setTestUser("mgorman")}>
                      <Calendar className="mr-2 h-4 w-4" />
                      <div>
                        <div className="font-medium">Michele Gorman</div>
                        <div className="text-xs text-muted-foreground">Scheduling Admin</div>
                      </div>
                    </DropdownMenuItem>

                    <DropdownMenuItem onClick={() => setTestUser("ggroman")}>
                      <ClipboardList className="mr-2 h-4 w-4" />
                      <div>
                        <div className="font-medium">Gabe Groman</div>
                        <div className="text-xs text-muted-foreground">Home Visit Liaison</div>
                      </div>
                    </DropdownMenuItem>

                    <DropdownMenuItem onClick={() => setTestUser("hsartin")}>
                      <FileText className="mr-2 h-4 w-4" />
                      <div>
                        <div className="font-medium">Heather Sartin</div>
                        <div className="text-xs text-muted-foreground">Case Manager</div>
                      </div>
                    </DropdownMenuItem>

                    <DropdownMenuItem onClick={() => setTestUser("smathis")}>
                      <Users className="mr-2 h-4 w-4" />
                      <div>
                        <div className="font-medium">Sheila Mathis</div>
                        <div className="text-xs text-muted-foreground">QA Director</div>
                      </div>
                    </DropdownMenuItem>

                    <DropdownMenuSeparator />

                    <DropdownMenuItem onClick={() => setTestUser("external")}>
                      <TestTube className="mr-2 h-4 w-4" />
                      <div>
                        <div className="font-medium">External User</div>
                        <div className="text-xs text-muted-foreground">No Permissions</div>
                      </div>
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
