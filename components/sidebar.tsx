"use client"

import { Home, Users, Calendar, LogOut, Shield } from "lucide-react"
import { useUser, useClerk } from "@clerk/nextjs"
import { usePermissions } from "@/hooks/use-permissions"
import {
  Sidebar as SidebarPrimitive,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import Link from "next/link"

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: Home, permission: null },
  { name: "Admin Panel", href: "/admin", icon: Shield, permission: "admin_access" },
  { name: "Users", href: "/admin/users", icon: Users, permission: "manage_users" },
  { name: "Invitations", href: "/admin/invitations", icon: Calendar, permission: "manage_invitations" },
]

export function Sidebar() {
  const { user } = useUser()
  const { signOut } = useClerk()
  const { permissions, loading } = usePermissions()

  const hasPermission = (permission: string | null) => {
    if (!permission) return true
    return permissions.some((p) => p.permission_code === permission)
  }

  const filteredNavigation = navigation.filter((item) => hasPermission(item.permission))

  return (
    <SidebarPrimitive>
      <SidebarHeader className="border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center space-x-3 p-4">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user?.imageUrl || "/placeholder.svg"} alt={user?.fullName || ""} />
            <AvatarFallback className="bg-refuge-purple text-white">
              {user?.firstName?.[0]}
              {user?.lastName?.[0]}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{user?.fullName}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {user?.primaryEmailAddress?.emailAddress}
            </p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredNavigation.map((item) => (
                <SidebarMenuItem key={item.name}>
                  <SidebarMenuButton asChild>
                    <Link href={item.href} className="flex items-center space-x-3">
                      <item.icon className="h-5 w-5" />
                      <span>{item.name}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-gray-200 dark:border-gray-800">
        <div className="p-4">
          <Button
            variant="ghost"
            className="w-full justify-start text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
            onClick={() => signOut()}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </SidebarFooter>

      <SidebarRail />
    </SidebarPrimitive>
  )
}
