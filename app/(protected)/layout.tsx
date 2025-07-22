import type React from "react"
import { auth, UserButton, currentUser } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { Sidebar } from "@/components/sidebar"

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { userId } = auth()
  if (!userId) {
    redirect("/")
  }

  const user = await currentUser()

  return (
    <div className="grid min-h-screen w-full lg:grid-cols-[280px_1fr]">
      <Sidebar />
      <div className="flex flex-col">
        <header className="flex h-16 items-center gap-4 border-b bg-white px-6 dark:bg-gray-900/40">
          <div className="flex-1">
            <h1 className="text-lg font-semibold">Dashboard</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600 dark:text-gray-300">Welcome, {user?.firstName || "User"}</span>
            <UserButton afterSignOutUrl="/" />
          </div>
        </header>
        <main className="flex-1 bg-gray-50/40 p-4 md:p-6 dark:bg-gray-800/40">{children}</main>
        <footer className="border-t bg-white p-6 dark:bg-gray-900/40">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-gray-600 dark:text-gray-400">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">
                © 2025 Refuge House | a 501(c)3 Not-for-Profit Charity
              </h3>
              <p className="mt-2">"A home is in the heart of every child."</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Refuge House, Inc.</h3>
              <p className="mt-2">5301 Alpha Rd | E80 | Dallas, TX 75240</p>
              <p>EIN: 41-2052825</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Refuge House San Antonio, Inc.</h3>
              <p className="mt-2">8000 IH 10 West | Suite 600 | San Antonio, TX 78230</p>
              <p>EIN: 41-2052826</p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}
