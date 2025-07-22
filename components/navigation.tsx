"use client"

import { useState } from "react"
import Link from "next/link"
import { useUser, UserButton } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Menu, Home, Map, List, BarChart3, Users } from "lucide-react"

export function Navigation() {
  const { isSignedIn, isLoaded } = useUser()
  const [isOpen, setIsOpen] = useState(false)

  const navigationItems = [
    { href: "/", label: "Home", icon: Home },
    { href: "/homes-map", label: "Homes Map", icon: Map },
    { href: "/homes-list", label: "Homes List", icon: List },
    { href: "/dashboard", label: "Dashboard", icon: BarChart3 },
    { href: "/admin", label: "Admin", icon: Users },
  ]

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/" className="flex items-center space-x-2">
              <Home className="h-6 w-6" />
              <span className="font-bold">Foster Home Visits</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            {isLoaded && isSignedIn && (
              <>
                {navigationItems.slice(1).map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center space-x-1 text-sm font-medium transition-colors hover:text-primary"
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Link>
                ))}
              </>
            )}
          </div>

          {/* User Actions */}
          <div className="flex items-center space-x-4">
            {isLoaded ? (
              isSignedIn ? (
                <UserButton afterSignOutUrl="/" />
              ) : (
                <div className="flex items-center space-x-2">
                  <Button asChild variant="ghost" size="sm">
                    <Link href="/sign-in">Sign In</Link>
                  </Button>
                  <Button asChild size="sm">
                    <Link href="/sign-up">Sign Up</Link>
                  </Button>
                </div>
              )
            ) : (
              <div className="h-8 w-8 animate-pulse rounded-full bg-muted" />
            )}

            {/* Mobile Menu */}
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild className="md:hidden">
                <Button variant="ghost" size="sm">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                <div className="flex flex-col space-y-4 mt-8">
                  {isLoaded && isSignedIn && (
                    <>
                      {navigationItems.map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          className="flex items-center space-x-2 text-sm font-medium transition-colors hover:text-primary"
                          onClick={() => setIsOpen(false)}
                        >
                          <item.icon className="h-4 w-4" />
                          <span>{item.label}</span>
                        </Link>
                      ))}
                    </>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  )
}
