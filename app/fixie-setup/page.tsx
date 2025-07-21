"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Copy } from "lucide-react"

export default function FixieSetupPage() {
  const fixieEnvVar = `FIXIE_SOCKS_HOST="socks://user:password@host:port"`
  const dbConnectorCode = `
// Custom connector function for Fixie SOCKS proxy
function createFixieConnector(config: sql.config) {
  return new Promise<net.Socket>((resolve, reject) => {
    if (!process.env.FIXIE_SOCKS_HOST) {
      return reject(new Error("FIXIE_SOCKS_HOST environment variable not set."))
    }

    const fixieUrl = process.env.FIXIE_SOCKS_HOST
    const match = fixieUrl.match(/(?:socks:\\/\\/)?([^:]+):([^@]+)@([^:]+):(\\d+)/)

    if (!match) {
      return reject(new Error("Invalid FIXIE_SOCKS_HOST format. Expected: user:password@host:port"))
    }

    const [, userId, password, host, port] = match

    console.log(\`Attempting SOCKS connection via \${host}:\${port}\`)

    SocksClient.createConnection(
      {
        proxy: {
          host: host,
          port: Number.parseInt(port, 10),
          type: 5, // SOCKS5
          userId: userId,
          password: password,
        },
        destination: {
          host: config.server,
          port: config.port || 1433,
        },
        command: "connect",
      },
      (err, info) => {
        if (err) {
          console.error("SOCKS connection error:", err)
          return reject(err)
        }

        console.log("SOCKS connection established. Initiating TLS handshake...")
        if (!info) {
          return reject(new Error("SOCKS connection info is undefined."))
        }

        const tlsSocket = tls.connect(
          {
            socket: info.socket,
            servername: config.server,
            rejectUnauthorized: true, // Enforce certificate validation
          },
          () => {
            if (tlsSocket.authorized) {
              console.log("TLS handshake successful. Socket is authorized.")
              resolve(tlsSocket)
            } else {
              const tlsError = tlsSocket.authorizationError || new Error("TLS authorization failed")
              console.error("TLS authorization failed:", tlsError)
              reject(tlsError)
            }
          },
        )

        tlsSocket.on("error", (error) => {
          console.error("TLS socket error:", error)
          reject(error)
        })
      },
    )
  })
}

// In your MSSQL connection config:
// if (process.env.FIXIE_SOCKS_HOST) {
//   config.options.connector = () => createFixieConnector(config)
// }
`

  const copyToClipboard = (text: string) => {
    navigator.clipboard
      .writeText(text)
      .then(() => alert("Copied to clipboard!"))
      .catch((err) => console.error("Failed to copy:", err))
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-4xl shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-gray-900 dark:text-gray-50">
            Fixie Static IP Proxy Setup Guide
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-8 text-gray-700 dark:text-gray-300">
          <p className="text-lg">
            This guide will walk you through setting up Fixie as your static IP proxy for secure database connections.
          </p>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-50 mb-4">
              Step 1: Obtain Your Fixie Proxy URL
            </h2>
            <p className="mb-4">
              If you haven't already, sign up for an account at{" "}
              <a
                href="https://www.fixie.ai/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline dark:text-blue-400"
              >
                Fixie.ai
              </a>
              . Once registered, you will be provided with a SOCKS5 proxy URL. It typically looks like this:
            </p>
            <div className="relative bg-gray-100 dark:bg-gray-800 p-4 rounded-md font-mono text-sm overflow-x-auto">
              <pre className="whitespace-pre-wrap break-all">
                <code>socks://&lt;username&gt;:&lt;password&gt;@&lt;host&gt;:&lt;port&gt;</code>
              </pre>
              <Button
                size="sm"
                variant="ghost"
                className="absolute top-2 right-2"
                onClick={() => copyToClipboard("socks://username:password@host:port")}
                aria-label="Copy example Fixie URL to clipboard"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <p className="mt-4">Make sure to note down your specific username, password, host, and port.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-50 mb-4">
              Step 2: Configure Environment Variable in Vercel
            </h2>
            <p className="mb-4">
              In your Vercel project settings, navigate to "Environment Variables" and add a new variable:
            </p>
            <div className="relative bg-gray-100 dark:bg-gray-800 p-4 rounded-md font-mono text-sm overflow-x-auto">
              <pre className="whitespace-pre-wrap break-all">
                <code>{fixieEnvVar}</code>
              </pre>
              <Button
                size="sm"
                variant="ghost"
                className="absolute top-2 right-2"
                onClick={() => copyToClipboard(fixieEnvVar)}
                aria-label="Copy Fixie environment variable to clipboard"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <p className="mt-4">Replace `user:password@host:port` with your actual Fixie proxy URL.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-50 mb-4">
              Step 3: Update Database Firewall Rules
            </h2>
            <p className="mb-4">
              Fixie provides a static IP address for your proxy. You need to add this IP address to your database's
              firewall rules to allow connections from Fixie.
            </p>
            <ul className="list-disc list-inside space-y-2">
              <li>Log in to your database provider's management console (e.g., Azure Portal for Azure SQL).</li>
              <li>Navigate to your database's networking or firewall settings.</li>
              <li>Add the static IP address provided by Fixie to the allowed IP addresses or firewall rules.</li>
            </ul>
            <p className="mt-4">
              Consult Fixie's documentation or your database provider's documentation for exact steps.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-50 mb-4">
              Step 4: Integrate Fixie Connector in `lib/db.ts`
            </h2>
            <p className="mb-4">
              The `lib/db.ts` file in this application already contains the necessary custom connector function to route
              MSSQL connections through the Fixie SOCKS proxy. You can review the code below:
            </p>
            <div className="relative bg-gray-100 dark:bg-gray-800 p-4 rounded-md font-mono text-sm overflow-x-auto">
              <pre className="whitespace-pre-wrap break-all">
                <code>{dbConnectorCode}</code>
              </pre>
              <Button
                size="sm"
                variant="ghost"
                className="absolute top-2 right-2"
                onClick={() => copyToClipboard(dbConnectorCode)}
                aria-label="Copy database connector code to clipboard"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <p className="mt-4">
              This code automatically uses the `FIXIE_SOCKS_HOST` environment variable if it's present.
            </p>
          </section>

          <div className="flex flex-col sm:flex-row justify-center gap-4 mt-8">
            <Link href="/connection-recipe">
              <Button className="w-full sm:w-auto" variant="default">
                View Connection Recipe
              </Button>
            </Link>
            <Link href="/diagnostics">
              <Button className="w-full sm:w-auto" variant="secondary">
                Run Diagnostics
              </Button>
            </Link>
            <Link href="/">
              <Button className="w-full sm:w-auto bg-transparent" variant="outline">
                Back to Home
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
