import { lusitana } from "@/app/ui/fonts"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Dashboard",
}

export default async function Page() {
  return (
    <main>
      <h1 className={`${lusitana.className} mb-4 text-xl md:text-2xl`}>Dashboard</h1>
      <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-4 lg:grid-cols-8">
        {/* <CardWrapper /> */}
        {/* <RevenueChart /> */}
        {/* <LatestInvoices /> */}
      </div>
    </main>
  )
}
