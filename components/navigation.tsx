"use client"

import Link from "next/link"
import { useUser, SignInButton, SignOutButton } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Home, Map, Users, Settings } from "lucide-react"
import Image from "next/image"

export function Navigation() {
  const { isSignedIn, user, isLoaded } = useUser()

  return (
    <nav className="border-b bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <Image src="/images/House Only.png" alt="Home Visits" width={32} height={32} className="h-8 w-8" />
              <span className="font-bold text-xl text-gray-900">Home Visits</span>
            </Link>

            {isSignedIn && (
              <NavigationMenu className="ml-8">
                <NavigationMenuList>
                  <NavigationMenuItem>
                    <Link href="/dashboard" legacyBehavior passHref>
                      <NavigationMenuLink className="group inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-accent/50 data-[state=open]:bg-accent/50">
                        <Home className="mr-2 h-4 w-4" />
                        Dashboard
                      </NavigationMenuLink>
                    </Link>
                  </NavigationMenuItem>

                  <NavigationMenuItem>
                    <NavigationMenuTrigger>
                      <Map className="mr-2 h-4 w-4" />
                      Homes
                    </NavigationMenuTrigger>
                    <NavigationMenuContent>
                      <div className="grid gap-3 p-4 w-[400px]">
                        <Link
                          href="/homes-map"
                          className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                          prefetch={false}
                        >
                          <div className="text-sm font-medium leading-none">Map View</div>
                          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                            View foster homes on an interactive map
                          </p>
                        </Link>
                        <Link
                          href="/homes-list"
                          className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                          prefetch={false}
                        >
                          <div className="text-sm font-medium leading-none">List View</div>
                          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                            Browse homes in a detailed list format
                          </p>
                        </Link>
                      </div>
                    </NavigationMenuContent>
                  </NavigationMenuItem>

                  <NavigationMenuItem>
                    <Link href="/admin" legacyBehavior passHref>
                      <NavigationMenuLink className="group inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-accent/50 data-[state=open]:bg-accent/50">
                        <Users className="mr-2 h-4 w-4" />
                        Admin
                      </NavigationMenuLink>
                    </Link>
                  </NavigationMenuItem>

                  <NavigationMenuItem>
                    <NavigationMenuTrigger>
                      <Settings className="mr-2 h-4 w-4" />
                      Tools
                    </NavigationMenuTrigger>
                    <NavigationMenuContent>
                      <div className="grid gap-3 p-4 w-[300px]">
                        <Link
                          href="/diagnostics"
                          className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                          prefetch={false}
                        >
                          <div className="text-sm font-medium leading-none">Diagnostics</div>
                          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                            System health and connection status
                          </p>
                        </Link>
                        <Link
                          href="/coordinate-test"
                          className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                          prefetch={false}
                        >
                          <div className="text-sm font-medium leading-none">Coordinate Test</div>
                          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                            Test coordinate geocoding functionality
                          </p>
                        </Link>
                      </div>
                    </NavigationMenuContent>
                  </NavigationMenuItem>
                </NavigationMenuList>
              </NavigationMenu>
            )}
          </div>

          <div className="flex items-center space-x-4">
            {!isLoaded ? (
              <div className="h-8 w-8 rounded-full bg-gray-200 animate-pulse" />
            ) : isSignedIn ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.imageUrl || "/placeholder.svg"} alt={user.fullName || ""} />
                      <AvatarFallback>
                        {user.firstName?.[0]}
                        {user.lastName?.[0]}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuItem className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user.fullName}</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user.primaryEmailAddress?.emailAddress}
                      </p>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <SignOutButton>
                      <button className="w-full text-left">Sign out</button>
                    </SignOutButton>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <SignInButton mode="modal">
                <Button>Sign In</Button>
              </SignInButton>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
