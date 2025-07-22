"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useUser, useClerk } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Home, Map, Users, Settings, LogOut, User } from "lucide-react"

export function Navigation() {
  const pathname = usePathname()
  const { user, isSignedIn } = useUser()
  const { signOut } = useClerk()

  const isActive = (path: string) => pathname === path

  if (!isSignedIn) {
    return (
      <nav className="border-b bg-white">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/" className="text-xl font-bold text-blue-600">
                RefugeHouse
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/sign-in">
                <Button variant="ghost">Sign In</Button>
              </Link>
              <Link href="/sign-up">
                <Button>Sign Up</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>
    )
  }

  return (
    <nav className="border-b bg-white">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center space-x-8">
            <Link href="/" className="text-xl font-bold text-blue-600">
              RefugeHouse
            </Link>

            <NavigationMenu>
              <NavigationMenuList>
                <NavigationMenuItem>
                  <Link href="/dashboard" legacyBehavior passHref>
                    <NavigationMenuLink
                      className={`px-3 py-2 rounded-md text-sm font-medium ${
                        isActive("/dashboard") ? "bg-blue-100 text-blue-700" : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      Dashboard
                    </NavigationMenuLink>
                  </Link>
                </NavigationMenuItem>

                <NavigationMenuItem>
                  <NavigationMenuTrigger>Homes</NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <div className="grid gap-3 p-4 w-[400px]">
                      <Link href="/homes-list" legacyBehavior passHref>
                        <NavigationMenuLink className="flex items-center space-x-2 p-2 rounded-md hover:bg-gray-100">
                          <Home className="h-4 w-4" />
                          <div>
                            <div className="text-sm font-medium">Homes List</div>
                            <div className="text-xs text-gray-500">View all foster homes</div>
                          </div>
                        </NavigationMenuLink>
                      </Link>
                      <Link href="/homes-map" legacyBehavior passHref>
                        <NavigationMenuLink className="flex items-center space-x-2 p-2 rounded-md hover:bg-gray-100">
                          <Map className="h-4 w-4" />
                          <div>
                            <div className="text-sm font-medium">Homes Map</div>
                            <div className="text-xs text-gray-500">View homes on map</div>
                          </div>
                        </NavigationMenuLink>
                      </Link>
                    </div>
                  </NavigationMenuContent>
                </NavigationMenuItem>

                <NavigationMenuItem>
                  <NavigationMenuTrigger>Admin</NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <div className="grid gap-3 p-4 w-[400px]">
                      <Link href="/admin" legacyBehavior passHref>
                        <NavigationMenuLink className="flex items-center space-x-2 p-2 rounded-md hover:bg-gray-100">
                          <Users className="h-4 w-4" />
                          <div>
                            <div className="text-sm font-medium">User Management</div>
                            <div className="text-xs text-gray-500">Manage users and permissions</div>
                          </div>
                        </NavigationMenuLink>
                      </Link>
                      <Link href="/admin/invitations" legacyBehavior passHref>
                        <NavigationMenuLink className="flex items-center space-x-2 p-2 rounded-md hover:bg-gray-100">
                          <Settings className="h-4 w-4" />
                          <div>
                            <div className="text-sm font-medium">Invitations</div>
                            <div className="text-xs text-gray-500">Send user invitations</div>
                          </div>
                        </NavigationMenuLink>
                      </Link>
                    </div>
                  </NavigationMenuContent>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
          </div>

          <div className="flex items-center space-x-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user?.imageUrl || "/placeholder.svg"} alt={user?.fullName || ""} />
                    <AvatarFallback>
                      {user?.firstName?.[0]}
                      {user?.lastName?.[0]}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-1 leading-none">
                    <p className="font-medium">{user?.fullName}</p>
                    <p className="w-[200px] truncate text-sm text-muted-foreground">
                      {user?.primaryEmailAddress?.emailAddress}
                    </p>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile" className="flex items-center">
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/settings" className="flex items-center">
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="cursor-pointer" onSelect={() => signOut()}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navigation
