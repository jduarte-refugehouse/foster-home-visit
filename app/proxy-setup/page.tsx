import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function ProxySetupPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-3xl shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-gray-900 dark:text-gray-50">Static IP Proxy Setup</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 text-gray-700 dark:text-gray-300">
          <p className="text-lg">
            To ensure secure and consistent access to your database, this application utilizes a static IP proxy. This
            helps in whitelisting a single, unchanging IP address in your database firewall rules, enhancing security
            and simplifying network management.
          </p>

          <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-50">Recommended Proxy Service: Fixie</h2>
          <p>
            We recommend using{" "}
            <a
              href="https://www.fixie.ai/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline dark:text-blue-400"
            >
              Fixie
            </a>{" "}
            for your static IP proxy needs. Fixie provides a reliable and easy-to-integrate SOCKS5 proxy that works
            seamlessly with Vercel deployments.
          </p>

          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-50">How to Set Up Fixie:</h3>
          <ol className="list-decimal list-inside space-y-2">
            <li>
              <span className="font-medium">Sign up for Fixie:</span> Visit the{" "}
              <a
                href="https://www.fixie.ai/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline dark:text-blue-400"
              >
                Fixie website
              </a>{" "}
              and create an account.
            </li>
            <li>
              <span className="font-medium">Obtain your Proxy URL:</span> After signing up, Fixie will provide you with
              a proxy URL, typically in the format `socks://user:password@host:port`.
            </li>
            <li>
              <span className="font-medium">Configure Environment Variable:</span> In your Vercel project settings, add
              an environment variable named `FIXIE_SOCKS_HOST` and set its value to the Fixie proxy URL you obtained.
            </li>
            <li>
              <span className="font-medium">Update Database Firewall:</span> Add the static IP address provided by Fixie
              to your database's firewall rules to allow incoming connections from the proxy.
            </li>
          </ol>

          <div className="flex flex-col sm:flex-row justify-center gap-4 mt-8">
            <Link href="/fixie-setup">
              <Button className="w-full sm:w-auto" variant="default">
                View Fixie Setup Guide
              </Button>
            </Link>
            <Link href="/connection-recipe">
              <Button className="w-full sm:w-auto bg-transparent" variant="outline">
                View Connection Recipe
              </Button>
            </Link>
            <Link href="/diagnostics">
              <Button className="w-full sm:w-auto" variant="secondary">
                Run Diagnostics
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
