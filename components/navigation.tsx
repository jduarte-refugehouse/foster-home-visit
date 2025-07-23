"use client"

import { UserButton, useUser } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Menu, Wrench } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

export function Navigation() {
  const { user } = useUser()

  // Check if user is system admin
  const isSystemAdmin = user?.primaryEmailAddress?.emailAddress === "jduarte@refugehouse.org"

  return (
    <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-8 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo and Title */}
        <div className="flex items-center gap-4">
          <Image
            src="/images/web logo with name.png"
            alt="Refuge House Logo"
            width={200}
            height={60}
            className="h-12 w-auto dark:brightness-0 dark:invert"
          />
          <div className="hidden md:block">
            <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Home Visits Service</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Welcome, {user?.firstName} {user?.lastName}
            </p>
          </div>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-6">
          {/* System Admin Button - Only visible to system admin */}
          {isSystemAdmin && (
            <Link href="/system-admin">
              <Button
                variant="outline"
                size="sm"
                className="bg-orange-500 text-white border-orange-500 hover:bg-orange-600 hover:border-orange-600 dark:bg-orange-600 dark:border-orange-600 dark:hover:bg-orange-700 dark:hover:border-orange-700"
              >
                <Wrench className="h-4 w-4 mr-2" />
                System Admin
              </Button>
            </Link>
          )}

          {/* User Profile */}
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
              <div className="flex flex-col space-y-6">
                {/* Mobile Logo */}
                <div className="flex items-center gap-3">
                  <Image
                    src="/images/web logo with name.png"
                    alt="Refuge House Logo"
                    width={150}
                    height={45}
                    className="h-10 w-auto dark:brightness-0 dark:invert"
                  />
                </div>

                {/* User Info */}
                <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{user?.primaryEmailAddress?.emailAddress}</p>
                </div>

                {/* Mobile Menu Items */}
                <div className="space-y-4">
                  {/* System Admin Button - Mobile */}
                  {isSystemAdmin && (
                    <Link href="/system-admin" className="block">
                      <Button
                        variant="outline"
                        className="w-full justify-start bg-orange-500 text-white border-orange-500 hover:bg-orange-600 hover:border-orange-600"
                      >
                        <Wrench className="h-4 w-4 mr-2" />
                        System Admin
                      </Button>
                    </Link>
                  )}

                  {/* User Profile - Mobile */}
                  <div className="pt-4">
                    <UserButton
                      appearance={{
                        elements: {
                          avatarBox: "h-10 w-10",
                        },
                      }}
                    />
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  )
}
