"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { BookOpen, User, Settings, PlusCircle, LayoutDashboard } from "lucide-react"
import { cn } from "@/lib/utils"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

const navigationItems = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Resource Library",
    href: "/resource-library",
    icon: BookOpen,
  },
  {
    name: "Profile",
    href: "/profile",
    icon: User,
  },
]

const adminItems = [
  {
    name: "Admin Dashboard",
    href: "/admin/dashboard",
    icon: Settings,
  },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="hidden border-r bg-gray-50/40 lg:block dark:bg-gray-800/40">
      <div className="flex h-full max-h-screen flex-col gap-2">
        <div className="flex h-16 items-center border-b px-6">
          <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
            <Image src="/images/House Only.png" width={32} height={32} alt="Refuge House Logo" />
            <span className="text-lg text-gray-800 dark:text-white">Refuge House</span>
          </Link>
        </div>
        <div className="flex-1 overflow-auto py-2">
          <nav className="grid items-start px-4 text-sm font-medium">
            <div className="mb-2 px-0">
              <span className="px-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Navigation</span>
              {navigationItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-gray-600 transition-all hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-50",
                    pathname === item.href && "bg-gray-200 text-gray-900 dark:bg-gray-700 dark:text-gray-50",
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.name}
                </Link>
              ))}
            </div>

            <Accordion type="single" collapsible defaultValue="item-1" className="w-full">
              <AccordionItem value="item-1" className="border-b-0">
                <AccordionTrigger className="px-2 text-xs font-semibold text-gray-500 uppercase tracking-wider hover:no-underline">
                  Administration
                </AccordionTrigger>
                <AccordionContent className="pb-0">
                  {adminItems.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-gray-600 transition-all hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-50",
                        pathname === item.href && "bg-gray-200 text-gray-900 dark:bg-gray-700 dark:text-gray-50",
                      )}
                    >
                      <item.icon className="h-4 w-4" />
                      {item.name}
                    </Link>
                  ))}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </nav>
        </div>
        <div className="mt-auto p-4">
          <Link
            href="/resources/create"
            className="flex w-full items-center justify-center gap-2 rounded-md bg-refuge-purple px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-refuge-purple/90"
          >
            <PlusCircle className="h-5 w-5" />
            Create Resource
          </Link>
        </div>
      </div>
    </div>
  )
}
