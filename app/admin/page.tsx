import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Database, Info, Network, FileCode, Globe, Settings, CheckCircle, Shield } from "lucide-react"

export default function AdminPanel() {
  const adminLinks = [
    {
      href: "/test-db",
      title: "Test Database",
      description: "Run a connection test against the Azure SQL database.",
      icon: Database,
    },
    {
      href: "/diagnostics",
      title: "Connection Diagnostics",
      description: "Diagnose issues with the Fixie SOCKS proxy connection.",
      icon: Info,
    },
    {
      href: "/solutions",
      title: "Connection Solutions",
      description: "Review different solutions for Vercel IP rotation.",
      icon: Network,
    },
    {
      href: "/connection-recipe",
      title: "Connection Recipe",
      description: "View the working code and configuration for the proxy.",
      icon: FileCode,
    },
    {
      href: "/ip-management",
      title: "IP Management",
      description: "Get commands to add Vercel's current IP to a firewall.",
      icon: Globe,
    },
    {
      href: "/proxy-setup",
      title: "Proxy Setup Guide",
      description: "General guide for setting up a static IP proxy.",
      icon: Settings,
    },
    {
      href: "/quotaguard-setup",
      title: "QuotaGuard Setup",
      description: "Specific setup instructions for QuotaGuard.",
      icon: Shield,
    },
    {
      href: "/fixie-setup",
      title: "Fixie Setup",
      description: "Specific setup instructions for Fixie.",
      icon: Shield,
    },
    {
      href: "/complete-setup",
      title: "Complete Setup Checklist",
      description: "An interactive checklist for completing the proxy setup.",
      icon: CheckCircle,
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <Shield className="w-8 h-8 text-red-600" />
              <span className="text-xl font-bold text-gray-900">Admin Panel</span>
            </div>
            <Link href="/">
              <Button variant="ghost">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Diagnostics & Setup Tools</h1>
            <p className="text-gray-600">Internal tools for testing and configuring the application.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {adminLinks.map((link) => {
              const Icon = link.icon
              return (
                <Link href={link.href} key={link.href}>
                  <Card className="hover:shadow-lg hover:border-blue-500 transition-all h-full">
                    <CardHeader>
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-gray-100 rounded-lg">
                          <Icon className="w-6 h-6 text-gray-700" />
                        </div>
                        <CardTitle>{link.title}</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <CardDescription>{link.description}</CardDescription>
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>
        </div>
      </main>
    </div>
  )
}
