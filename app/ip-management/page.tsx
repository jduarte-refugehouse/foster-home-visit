import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { ArrowLeft, Globe, Lock, RefreshCw, CheckCircle, XCircle } from "lucide-react"
import Image from "next/image"

const LOGO_SRC = "/images/web logo with name.png"

export default function IpManagement() {
  // Placeholder for current IP and proxy status
  const currentIp = "203.0.113.45" // This would be fetched dynamically
  const isUsingProxy = true // This would be determined dynamically
  const proxyIp = "52.87.187.138" // This would be fetched from proxy service

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header */}
      <header className="px-4 lg:px-6 h-14 flex items-center justify-between bg-white border-b border-gray-200">
        <div className="flex items-center space-x-4">
          <Link href="/">
            <Button variant="ghost">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>
          <div className="flex items-center space-x-2">
            <Image
              src={LOGO_SRC || "/placeholder.svg"}
              alt="Family Visits Pro Logo"
              width={180}
              height={36}
              className="h-auto"
            />
            <span className="text-lg font-semibold text-gray-900">IP Management</span>
          </div>
        </div>
        <nav className="ml-auto flex gap-4 sm:gap-6">
          <Link className="text-sm font-medium hover:underline underline-offset-4 text-gray-600" href="/features">
            Features
          </Link>
          <Link className="text-sm font-medium hover:underline underline-offset-4 text-gray-600" href="/solutions">
            Solutions
          </Link>
          <Link className="text-sm font-medium hover:underline underline-offset-4 text-gray-600" href="/contact">
            Contact
          </Link>
          <Link className="text-sm font-medium hover:underline underline-offset-4 text-gray-600" href="/admin">
            Admin
          </Link>
        </nav>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">IP Address & Proxy Status</h1>
            <p className="text-lg text-gray-600 max-w-xl mx-auto">
              Monitor your application's outbound IP address and proxy connection status.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2">
            {/* Current IP Card */}
            <Card>
              <CardHeader>
                <Globe className="w-8 h-8 text-refuge-purple mb-2" />
                <CardTitle>Current Outbound IP</CardTitle>
                <CardDescription>
                  The IP address your application is currently using to connect externally.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-gray-900 mb-4">{currentIp}</div>
                <p className="text-sm text-gray-600">
                  This IP address can change frequently on Vercel without a static proxy.
                </p>
                <Button variant="outline" className="mt-4 bg-transparent">
                  <RefreshCw className="w-4 h-4 mr-2" /> Refresh IP
                </Button>
              </CardContent>
            </Card>

            {/* Proxy Status Card */}
            <Card>
              <CardHeader>
                <Lock className="w-8 h-8 text-refuge-blue mb-2" />
                <CardTitle>Static Proxy Status</CardTitle>
                <CardDescription>
                  Indicates if your application is routing traffic through a static IP proxy.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-3 mb-4">
                  {isUsingProxy ? (
                    <CheckCircle className="w-8 h-8 text-green-500" />
                  ) : (
                    <XCircle className="w-8 h-8 text-red-500" />
                  )}
                  <span className={`text-4xl font-bold ${isUsingProxy ? "text-green-600" : "text-red-600"}`}>
                    {isUsingProxy ? "Active" : "Inactive"}
                  </span>
                </div>
                {isUsingProxy ? (
                  <p className="text-sm text-gray-600">
                    Traffic is routing through static IP: <code className="font-mono">{proxyIp}</code>
                  </p>
                ) : (
                  <p className="text-sm text-gray-600">
                    Your application is not currently using a static IP proxy. Database connections may be blocked by
                    firewalls.
                  </p>
                )}
                <Button asChild className="mt-4">
                  <Link href="/proxy-setup">
                    <Lock className="w-4 h-4 mr-2" /> Configure Proxy
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Why Use a Static IP Proxy */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Why Use a Static IP Proxy?</CardTitle>
              <CardDescription>Understand the benefits for database connections.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700">
                Vercel's serverless functions use dynamic IP addresses, which change frequently. This can cause issues
                when connecting to databases like Azure SQL that rely on static IP firewall rules for security.
              </p>
              <p className="text-gray-700 mt-4">
                A static IP proxy routes your application's outbound traffic through a fixed, known IP address. This
                allows you to whitelist that single IP in your database firewall, ensuring consistent and secure
                connections without needing to constantly update firewall rules. This is crucial for maintaining HIPAA
                compliance and reliable service.
              </p>
              <Button asChild variant="link" className="p-0 h-auto mt-4">
                <Link href="/proxy-setup">Learn more about proxy setup</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-4 lg:px-6 h-14 flex items-center justify-center bg-white border-t border-gray-200 text-sm text-gray-600">
        <p>&copy; 2024 Family Visits Pro. All rights reserved.</p>
      </footer>
    </div>
  )
}
