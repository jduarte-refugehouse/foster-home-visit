"use client"

import { UserButton, useUser } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Menu, Wrench } from "lucide-react"
import Link from "next/link"

export function Navigation() {
  const { user } = useUser()

  const isSystemAdmin = user?.primaryEmailAddress?.emailAddress === "jduarte@refugehouse.org"

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 dark:border-gray-700 dark:bg-gray-900/95">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo/Brand */}
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="h-8 w-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">HV</span>
              </div>
              <span className="font-semibold text-gray-900 dark:text-gray-100">Home Visits</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            {isSystemAdmin && (
              <Link href="/system-admin">
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100 hover:border-orange-300 dark:bg-orange-900/20 dark:border-orange-800 dark:text-orange-400 dark:hover:bg-orange-900/30"
                >
                  <Wrench className="h-4 w-4 mr-2" />
                  System Admin
                </Button>
              </Link>
            )}
            <UserButton
              appearance={{
                elements: {
                  avatarBox: "h-8 w-8",
                },
              }}
            />
          </div>

          {/* Mobile Navigation */}
          <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80 p-6">
                <div className="flex flex-col gap-6">
                  <div className="flex items-center gap-3">
                    <UserButton
                      appearance={{
                        elements: {
                          avatarBox: "h-10 w-10",
                        },
                      }}
                    />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        {user?.firstName} {user?.lastName}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {user?.primaryEmailAddress?.emailAddress}
                      </p>
                    </div>
                  </div>

                  {isSystemAdmin && (
                    <Link href="/system-admin">
                      <Button
                        variant="outline"
                        className="w-full justify-start bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100 hover:border-orange-300 dark:bg-orange-900/20 dark:border-orange-800 dark:text-orange-400 dark:hover:bg-orange-900/30"
                      >
                        <Wrench className="h-4 w-4 mr-2" />
                        System Admin
                      </Button>
                    </Link>
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
