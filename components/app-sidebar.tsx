"use client"

import { useEffect, useState, useRef } from "react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@refugehouse/shared-core/components/ui/sidebar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@refugehouse/shared-core/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@refugehouse/shared-core/components/ui/avatar"
import { Badge } from "@refugehouse/shared-core/components/ui/badge"
import { SignOutButton, useUser } from "@clerk/nextjs"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@refugehouse/shared-core/components/ui/collapsible"
import {
  Home,
  Calendar,
  BarChart3,
  Map,
  List,
  Users,
  Settings,
  Database,
  UserCog,
  FileText,
  Shield,
  Plus,
  User,
  BookOpen,
  type LucideIcon,
  ChevronUp,
  ChevronDown,
  LogOut,
  MessageSquare,
  History,
  TestTube,
} from "lucide-react"
import Link from "next/link"

// Icon mapping for dynamic icons
const iconMap: Record<string, LucideIcon> = {
  Home,
  Calendar,
  BarChart3,
  Map,
  List,
  Users,
  Settings,
  Database,
  UserCog,
  FileText,
  Shield,
  Plus,
  BookOpen,
  MessageSquare,
  History,
  TestTube,
}

interface NavigationItem {
  code: string
  title: string
  url: string
  icon: string
  order: number
}

interface NavigationCategory {
  title: string
  items: NavigationItem[]
}

interface NavigationMetadata {
  source: string
  totalItems: number
  visibleItems: number
  microservice: {
    code: string
    name: string
    description: string
  }
  timestamp: string
  dbError?: string
  userPermissions?: string[]
  userInfo?: any
  error?: string
}

// Emergency fallback navigation if everything fails
const EMERGENCY_NAVIGATION: NavigationCategory[] = [
  {
    title: "Navigation",
    items: [
      { code: "dashboard", title: "Dashboard", url: "/dashboard", icon: "Home", order: 1 },
      { code: "homes_map", title: "Homes Map", url: "/homes-map", icon: "Map", order: 2 },
      { code: "homes_list", title: "Homes List", url: "/homes-list", icon: "List", order: 3 },
    ],
  },
  {
    title: "Administration",
    items: [{ code: "diagnostics", title: "Diagnostics", url: "/diagnostics", icon: "Database", order: 1 }],
  },
]

export function AppSidebar() {
  const { user, isLoaded } = useUser()
  const [navigationItems, setNavigationItems] = useState<NavigationCategory[]>([])
  const [navigationMetadata, setNavigationMetadata] = useState<NavigationMetadata | null>(null)
  const [isLoadingNav, setIsLoadingNav] = useState(true)
  const [navError, setNavError] = useState<string | null>(null)
  const [usersOpen, setUsersOpen] = useState(false)
  const [systemOpen, setSystemOpen] = useState(false)

  // Load navigation items
  useEffect(() => {
    const loadNavigation = async () => {
      if (!isLoaded || !user) {
        console.log("⏳ [NAV] Waiting for Clerk user:", { isLoaded, hasUser: !!user })
        return
      }

      try {
        console.log("🔄 Loading navigation from API...")
        console.log("👤 [NAV] Clerk user:", {
          id: user.id,
          email: user.emailAddresses[0]?.emailAddress,
          hasEmail: !!user.emailAddresses[0]?.emailAddress,
        })

        // Create headers with user identity from Clerk
        const headers: HeadersInit = {
          "x-user-email": user.emailAddresses[0]?.emailAddress || "",
          "x-user-clerk-id": user.id,
          "x-user-name": `${user.firstName || ""} ${user.lastName || ""}`.trim(),
        }

        console.log("📤 [NAV] Headers being sent:", {
          "x-user-email": headers["x-user-email"],
          "x-user-clerk-id": headers["x-user-clerk-id"],
          "x-user-name": headers["x-user-name"],
        })

        const response = await fetch("/api/navigation", { 
          headers,
          credentials: 'include', // Ensure cookies are sent
        })

        if (response.ok) {
          const data = await response.json()
          console.log("📥 Navigation API response:", data.metadata)

          setNavigationItems(data.navigation || [])
          setNavigationMetadata(data.metadata)
          setNavError(null)

          // Log navigation source for debugging
          const source = data.metadata?.source || "unknown"
          const sourceEmojiMap: Record<string, string> = {
            database: "🗄️",
            config_fallback: "✱",
            config_default: "✱",
            error_fallback: "❌",
          }
          const sourceEmoji = sourceEmojiMap[source] || "❓"

          // Only show fallback warnings for admins/internal users
          const isAdmin = data.metadata?.userPermissions?.includes('system_config') || 
                         data.metadata?.userInfo?.email?.endsWith('@refugehouse.org')
          
          if (isAdmin || source === "database") {
            console.log(`${sourceEmoji} Navigation loaded from: ${source}`)
            if (data.metadata?.dbError) {
              console.warn("⚠️ Database error:", data.metadata.dbError)
            }
          }

          // Log user info for debugging (admin only)
          if (isAdmin) {
            if (data.metadata?.userInfo) {
              console.log("👤 User info:", data.metadata.userInfo)
            }
            if (data.metadata?.userPermissions) {
              console.log("🔑 User permissions:", data.metadata.userPermissions)
            }
          }
        } else {
          const errorData = await response.json().catch(() => ({}))
          console.error("❌ Failed to load navigation from API")
          
          // SECURITY: If user is not authenticated/found, show nothing (fail securely)
          const isAuthRequired = errorData.metadata?.source === "auth_required" || 
                                 errorData.metadata?.source === "user_not_found" ||
                                 !errorData.metadata?.userInfo
          
          if (!user || isAuthRequired) {
            console.log("🔒 SECURITY: User not authenticated - showing empty navigation")
            setNavigationItems([])
            setNavError("Access denied. Please sign in.")
            return
          }
          
          // Only show emergency fallback if user IS authenticated but API failed
          console.error("⚠️ API failed but user is authenticated - using emergency fallback")
          setNavigationItems(EMERGENCY_NAVIGATION)
          setNavError(`API Error: ${response.status}`)
        }
      } catch (error) {
        console.error("❌ Error loading navigation:", error)
        
        // SECURITY: If user is not authenticated, show nothing (fail securely)
        if (!user) {
          console.log("🔒 SECURITY: User not authenticated - showing empty navigation")
          setNavigationItems([])
          setNavError("Access denied. Please sign in.")
          return
        }
        
        // Only show emergency fallback if user IS authenticated but error occurred
        console.error("⚠️ Error occurred but user is authenticated - using emergency fallback")
        setNavigationItems(EMERGENCY_NAVIGATION)
        setNavError(error instanceof Error ? error.message : "Unknown error")
      } finally {
        setIsLoadingNav(false)
      }
    }

    loadNavigation()
  }, [isLoaded, user])

  if (!isLoaded || isLoadingNav) {
    return (
      <Sidebar>
        <SidebarHeader className="h-20 p-6 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-gray-200 animate-pulse" />
            <div className="space-y-2">
              <div className="h-4 w-32 rounded bg-gray-200 animate-pulse" />
              <div className="h-3 w-24 rounded bg-gray-200 animate-pulse" />
            </div>
          </div>
        </SidebarHeader>
        <SidebarContent className="p-4">
          <div className="space-y-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-10 w-full rounded-lg bg-gray-200 animate-pulse" />
            ))}
          </div>
        </SidebarContent>
      </Sidebar>
    )
  }

  const userInitials = user
    ? `${user.firstName || ""}${user.lastName || ""}`.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || user.emailAddresses[0]?.emailAddress?.[0]?.toUpperCase() || "U"
    : "U"

  const displayName = user
    ? `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.emailAddresses[0]?.emailAddress || "User"
    : "User"

  // Check if user has admin permissions
  const isAdmin = navigationMetadata?.userPermissions?.some((p) => p.includes("admin") || p.includes("system")) || false

  // Only show badge for fallback modes (not database)
  const getFallbackBadge = () => {
    if (!navigationMetadata || navigationMetadata.source === "database") return null

    const sourceConfig: Record<string, { label: string; variant: "secondary" | "outline" | "destructive" }> = {
      config_fallback: { label: "✱ Fallback", variant: "secondary" },
      config_default: { label: "✱ Default", variant: "outline" },
      error_fallback: { label: "✱ Error", variant: "destructive" },
    }

    const config = sourceConfig[navigationMetadata.source]
    if (!config) return null

    return (
      <Badge variant={config.variant} className="text-xs">
        {config.label}
      </Badge>
    )
  }

  // Separate navigation and administration items
  const navigationGroups = navigationItems.filter((group) => group.title !== "Administration")
  const administrationGroup = navigationItems.find((group) => group.title === "Administration")

  // Group Administration items into "Users" and "System" domains
  const groupAdministrationItems = (items: NavigationItem[]) => {
    const userItems: NavigationItem[] = []
    const systemItems: NavigationItem[] = []

    items.forEach((item) => {
      // User-related items
      if (
        item.code === "user_invitations" ||
        item.code === "user_management"
      ) {
        userItems.push(item)
      }
      // System-related items
      else if (
        item.code === "system_admin" ||
        item.code === "diagnostics" ||
        item.code === "feature_development" ||
        item.code === "bulk_sms" ||
        item.code === "test_logging" ||
        item.code === "communication_history"
      ) {
        systemItems.push(item)
      }
      // Default to system if not categorized
      else {
        systemItems.push(item)
      }
    })

    return {
      users: userItems.sort((a, b) => a.order - b.order),
      system: systemItems.sort((a, b) => a.order - b.order),
    }
  }

  return (
    <Sidebar className="border-r border-gray-200 flex flex-col">
      <SidebarHeader className="h-20 p-4 border-b bg-gradient-to-r from-refuge-light-purple/10 via-refuge-purple/5 to-refuge-magenta/10 flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center">
            <img
              src="/images/web logo with name.png"
              alt="Refuge House Logo"
              className="h-14 object-contain hover:scale-105 transition-transform duration-200"
            />
          </div>
          <div className="flex flex-col flex-1 min-w-0">
            {getFallbackBadge() && <div className="flex items-center gap-2 mb-1">{getFallbackBadge()}</div>}
            {process.env.NODE_ENV === "development" && (
              <span className="text-xs text-refuge-purple font-medium">Development Mode</span>
            )}
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="flex-1 p-4">
        {navigationItems.length === 0 ? (
          <div className="p-6 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-refuge-light-purple/20 to-refuge-magenta/20 rounded-full flex items-center justify-center">
              <Database className="w-8 h-8 text-refuge-purple" />
            </div>
            {/* SECURITY: Show different messages based on authentication state */}
            {!user ? (
              // Authentication failed - show nothing
              <>
                <p className="text-sm font-medium text-foreground mb-2">Access Denied</p>
                <p className="text-xs text-muted-foreground mb-3">Please sign in to continue.</p>
              </>
            ) : !navigationMetadata?.userInfo ? (
              // Authenticated but user not found in database
              <>
                <p className="text-sm font-medium text-foreground mb-2">Account Registration Required</p>
                <p className="text-xs text-muted-foreground mb-3">
                  You are signed in as {user.emailAddresses[0]?.emailAddress || "User"}
                </p>
                <p className="text-xs text-muted-foreground">
                  Your account needs to be registered in the system to access navigation.
                </p>
                {/* SECURITY: No links shown when user not found in database */}
              </>
            ) : (
              // User authenticated and found in database - show error info if any
              <>
            <p className="text-sm font-medium text-foreground mb-2">No navigation items available</p>
            {navError && <p className="text-xs text-red-600 dark:text-red-400 mb-3">Error: {navError}</p>}
            {navigationMetadata?.dbError && (
              <p className="text-xs text-muted-foreground mb-3">Database: {navigationMetadata.dbError}</p>
            )}
                {/* SECURITY: Only show diagnostics link if user IS found in database */}
            <Link
              href="/diagnostics"
              className="inline-flex items-center text-xs text-refuge-purple hover:text-refuge-magenta font-medium transition-colors duration-200"
            >
              <Database className="w-3 h-3 mr-1" />
              Check diagnostics
            </Link>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Regular Navigation Groups */}
            {navigationGroups.map((group, groupIndex) => (
              <SidebarGroup key={group.title}>
                <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  {group.title}
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu className="space-y-1">
                    {group.items.map((item) => {
                      const IconComponent = iconMap[item.icon] || Home
                      return (
                        <SidebarMenuItem key={item.code}>
                          <SidebarMenuButton asChild className="group">
                            <Link
                              href={item.url}
                              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-foreground hover:text-refuge-purple dark:hover:text-refuge-light-purple hover:bg-gradient-to-r hover:from-refuge-light-purple/10 hover:to-refuge-magenta/10 transition-all duration-200 group-hover:shadow-sm"
                            >
                              <IconComponent className="h-5 w-5 text-muted-foreground group-hover:text-refuge-purple dark:group-hover:text-refuge-light-purple transition-colors" />
                              <span className="font-medium">{item.title}</span>
                            </Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      )
                    })}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            ))}
          </div>
        )}
      </SidebarContent>

      {/* Administration Section - Anchored to Bottom */}
      {administrationGroup && administrationGroup.items.length > 0 && (() => {
        const grouped = groupAdministrationItems(administrationGroup.items)

        return (
          <div className="border-t bg-gradient-to-r from-refuge-purple/5 to-refuge-magenta/5 p-4">
            <SidebarGroup>
              <SidebarGroupLabel className="text-xs font-semibold text-refuge-purple uppercase tracking-wider mb-3 flex items-center gap-2">
                <Shield className="h-3 w-3" />
                {administrationGroup.title}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <div className="space-y-1">
                  {/* Users Domain */}
                  {grouped.users.length > 0 && (
                    <Collapsible open={usersOpen} onOpenChange={setUsersOpen}>
                      <CollapsibleTrigger asChild>
                        <button className="flex w-full items-center justify-between gap-2 px-3 py-2 rounded-lg text-sm font-medium text-refuge-purple hover:bg-refuge-purple/10 transition-colors">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            <span>Users</span>
                          </div>
                          {usersOpen ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronUp className="h-4 w-4" />
                          )}
                        </button>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <SidebarMenu className="space-y-1 mt-1 ml-4">
                          {grouped.users.map((item) => {
                            const IconComponent = iconMap[item.icon] || Settings
                            return (
                              <SidebarMenuItem key={item.code}>
                                <SidebarMenuButton asChild className="group">
                                  <Link
                                    href={item.url}
                                    className="flex items-center gap-3 px-3 py-2 rounded-lg text-foreground hover:text-refuge-purple dark:hover:text-refuge-light-purple hover:bg-gradient-to-r hover:from-refuge-light-purple/10 hover:to-refuge-magenta/10 transition-all duration-200 group-hover:shadow-sm"
                                  >
                                    <IconComponent className="h-4 w-4 text-refuge-purple dark:text-refuge-light-purple group-hover:text-refuge-magenta transition-colors" />
                                    <span className="text-sm font-medium">{item.title}</span>
                                  </Link>
                                </SidebarMenuButton>
                              </SidebarMenuItem>
                            )
                          })}
                        </SidebarMenu>
                      </CollapsibleContent>
                    </Collapsible>
                  )}

                  {/* System Domain */}
                  {grouped.system.length > 0 && (
                    <Collapsible open={systemOpen} onOpenChange={setSystemOpen}>
                      <CollapsibleTrigger asChild>
                        <button className="flex w-full items-center justify-between gap-2 px-3 py-2 rounded-lg text-sm font-medium text-refuge-purple hover:bg-refuge-purple/10 transition-colors">
                          <div className="flex items-center gap-2">
                            <Settings className="h-4 w-4" />
                            <span>System</span>
                          </div>
                          {systemOpen ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronUp className="h-4 w-4" />
                          )}
                        </button>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <SidebarMenu className="space-y-1 mt-1 ml-4">
                          {grouped.system.map((item) => {
                            const IconComponent = iconMap[item.icon] || Settings
                            return (
                              <SidebarMenuItem key={item.code}>
                                <SidebarMenuButton asChild className="group">
                                  <Link
                                    href={item.url}
                                    className="flex items-center gap-3 px-3 py-2 rounded-lg text-foreground hover:text-refuge-purple dark:hover:text-refuge-light-purple hover:bg-gradient-to-r hover:from-refuge-light-purple/10 hover:to-refuge-magenta/10 transition-all duration-200 group-hover:shadow-sm"
                                  >
                                    <IconComponent className="h-4 w-4 text-refuge-purple dark:text-refuge-light-purple group-hover:text-refuge-magenta transition-colors" />
                                    <span className="text-sm font-medium">{item.title}</span>
                                  </Link>
                                </SidebarMenuButton>
                              </SidebarMenuItem>
                            )
                          })}
                        </SidebarMenu>
                      </CollapsibleContent>
                    </Collapsible>
                  )}
                </div>
              </SidebarGroupContent>
            </SidebarGroup>
          </div>
        )
      })()}

      <SidebarFooter className="p-4 border-t bg-gradient-to-r from-gray-50 to-refuge-light-purple/10">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton className="w-full hover:bg-gradient-to-r hover:from-refuge-light-purple/10 hover:to-refuge-magenta/10 transition-all duration-200">
                  <Avatar className="h-8 w-8 ring-2 ring-refuge-light-purple/30">
                    <AvatarImage src={user?.imageUrl} />
                    <AvatarFallback className="bg-gradient-to-br from-refuge-purple to-refuge-magenta text-white text-xs font-semibold">
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col items-start flex-1 min-w-0">
                    <span className="text-sm font-medium text-foreground truncate">{displayName}</span>
                    {isAdmin && <span className="text-xs text-refuge-purple dark:text-refuge-light-purple font-medium">Administrator</span>}
                  </div>
                  <ChevronUp className="ml-auto h-4 w-4 text-muted-foreground" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" className="w-56">
                <DropdownMenuItem asChild>
                  <a href="/user-profile" className="cursor-pointer flex items-center">
                    <User className="mr-2 h-4 w-4" />
                    Profile Settings
                  </a>
                </DropdownMenuItem>
                {navigationMetadata && process.env.NODE_ENV === "development" && (
                  <>
                    <DropdownMenuItem disabled className="text-xs text-muted-foreground">
                      Navigation: {navigationMetadata.source} ({navigationMetadata.visibleItems}/
                      {navigationMetadata.totalItems})
                    </DropdownMenuItem>
                    <DropdownMenuItem disabled className="text-xs text-muted-foreground">
                      Service: {navigationMetadata.microservice.code}
                    </DropdownMenuItem>
                    {navigationMetadata.userPermissions && (
                      <DropdownMenuItem disabled className="text-xs text-muted-foreground">
                        Permissions: {navigationMetadata.userPermissions.length}
                      </DropdownMenuItem>
                    )}
                  </>
                )}
                <SignOutButton>
                  <DropdownMenuItem className="cursor-pointer text-red-600 focus:text-red-700">
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign out
                  </DropdownMenuItem>
                </SignOutButton>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
