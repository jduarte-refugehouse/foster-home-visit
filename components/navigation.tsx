"use client"

import { useState } from "react"
import { UserButton, useUser } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Menu, Wrench } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

export function Navigation() {
  const [isOpen, setIsOpen] = useState(false)
  const { user } = useUser()

  // Check if user is system admin
  const isSystemAdmin = user?.primaryEmailAddress?.emailAddress === "jduarte@refugehouse.org"

  return (
    <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-8 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo and Title */}
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/images/web logo with name.png"
              alt="Refuge House Logo"
              width={120}
              height={40}
              className="h-10 w-auto dark:brightness-0 dark:invert"
            />
          </Link>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-6">
          {/* System Admin Button - Only for jduarte@refugehouse.org */}
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

          {/* User Profile */}
          <UserButton
            appearance={{
              elements: {
                avatarBox: "h-8 w-8",
              },
            }}
            afterSignOutUrl="/"
          />
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden flex items-center gap-4">
          {/* User Profile - Mobile */}
          <UserButton
            appearance={{
              elements: {
                avatarBox: "h-8 w-8",
              },
            }}
            afterSignOutUrl="/"
          />

          {/* Mobile Menu */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80 p-6">
              <div className="flex flex-col gap-6 mt-8">
                {/* System Admin Button - Mobile */}
                {isSystemAdmin && (
                  <Link href="/system-admin" onClick={() => setIsOpen(false)}>
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
    </nav>
  )
}
