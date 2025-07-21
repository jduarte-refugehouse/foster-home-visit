"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Home, Map, List, Settings, Database, Network, Info, LocateFixed, CalendarDays, Users } from "lucide-react"

export default function HomePage() {
  const quickLinks = [
    {
      title: "Dashboard",
      description: "Get an overview of your family visits and key metrics.",
      href: "/dashboard",
      icon: Home,
      color: "text-refuge-purple",
    },
    {
      title: "Homes List",
      description: "View and manage a comprehensive list of all homes.",
      href: "/homes-list",
      icon: List,
      color: "text-refuge-magenta",
    },
    {
      title: "Homes Map",
      description: "Explore homes visually on an interactive map.",
      href: "/homes-map",
      icon: Map,
      color: "text-refuge-light-purple",
    },
    {
      title: "Admin Panel",
      description: "Access administrative tools and settings.",
      href: "/admin",
      icon: Settings,
      color: "text-refuge-dark-blue",
    },
    {
      title: "Visit Scheduling",
      description: "Efficiently schedule and track upcoming home visits.",
      href: "/schedule", // Assuming a new schedule page
      icon: CalendarDays,
      color: "text-refuge-purple",
    },
    {
      title: "User Management",
      description: "Administer user accounts, roles, and permissions.",
      href: "/users", // Assuming a new users page
      icon: Users,
      color: "text-refuge-magenta",
    },
    {
      title: "Database Diagnostics",
      description: "Test and monitor your database connection and proxy setup.",
      href: "/diagnostics",
      icon: Database,
      color: "text-refuge-light-purple",
    },
    {
      title: "Proxy Setup",
      description: "Configure and verify your static IP proxy settings.",
      href: "/proxy-setup",
      icon: Network,
      color: "text-refuge-dark-blue",
    },
    {
      title: "Connection Recipe",
      description: "View the code and configuration for database connection.",
      href: "/connection-recipe",
      icon: Info,
      color: "text-refuge-purple",
    },
    {
      title: "Coordinate Test",
      description: "Test access to coordinate data for homes.",
      href: "/coordinate-test",
      icon: LocateFixed,
      color: "text-refuge-magenta",
    },
  ]

  return (
    <div className="min-h-screen bg-refuge-gray text-gray-900 dark:bg-gray-900 dark:text-gray-50 flex flex-col">
      <main className="flex-1 py-12 px-4 md:px-6 lg:py-24">
        <section className="container mx-auto text-center mb-12">
          <h1 className="text-4xl font-bold tracking-tight text-refuge-purple dark:text-gray-50 sm:text-5xl md:text-6xl">
            Welcome to the Home Visits Application
          </h1>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Your central hub for managing home visits, data, and administrative tasks.
          </p>
        </section>

        <section className="container mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quickLinks.map((link) => {
            const Icon = link.icon
            return (
              <Link href={link.href} key={link.title}>
                <Card className="flex flex-col items-center p-6 text-center h-full hover:shadow-lg transition-shadow duration-200">
                  <CardHeader>
                    <Icon className={`h-12 w-12 ${link.color} mb-4`} />
                    <CardTitle className="text-xl font-semibold">{link.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-4">{link.description}</p>
                    <Button variant="outline" className={`border-2 ${link.color} hover:bg-opacity-10`}>
                      Go to {link.title.split(" ")[0]}
                    </Button>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </section>
      </main>

      <footer className="bg-white dark:bg-gray-800 py-6 px-4 md:px-6 text-center text-gray-600 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700">
        <p>&copy; {new Date().getFullYear()} Home Visits Application. All rights reserved.</p>
      </footer>
    </div>
  )
}
