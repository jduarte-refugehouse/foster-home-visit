"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, CheckCircle, Copy, FileCode, Terminal } from "lucide-react"
import Link from "next/link"

export default function ConnectionRecipe() {
  const [copied, setCopied] = useState(false)

  const dbLibCode = `
import sql from "mssql"
import type net from "net"
import tls from "tls"
import { SocksClient } from "socks"

let pool: sql.ConnectionPool | null = null

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
    SocksClient.createConnection(
      {
        proxy: { host, port: Number.parseInt(port, 10), type: 5, userId, password },
        destination: { host: config.server, port: config.port || 1433 },
        command: "connect",
      },
      (err, info) => {
        if (err) return reject(err)
        if (!info) return reject(new Error("SOCKS connection info is undefined."))
        const tlsSocket = tls.connect({ socket: info.socket, servername: config.server, rejectUnauthorized: true }, () => {
          if (tlsSocket.authorized) resolve(tlsSocket)
          else reject(tlsSocket.authorizationError || new Error("TLS authorization failed"))
        })
        tlsSocket.on("error", (error) => reject(error))
      },
    )
  })
}

// ... (getConnection, query, etc. functions remain the same)
`

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link href="/">
                <Button variant="ghost">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Home
                </Button>
              </Link>
              <div className="flex items-center space-x-2">
                <FileCode className="w-6 h-6 text-green-600" />
                <span className="text-lg font-semibold text-gray-900">Connection Recipe</span>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Azure SQL + Fixie Proxy: The Connection Recipe</h1>
            <p className="text-gray-600">The proven, working configuration for connecting to Azure SQL from Vercel.</p>
          </div>

          <Alert className="mb-8 bg-green-50 border-green-200 text-green-800">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription>
              <strong>This is the successful connection strategy.</strong> Follow these steps to ensure a reliable
              database connection.
            </AlertDescription>
          </Alert>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>The Code: lib/db.ts</CardTitle>
                <CardDescription>This is the exact code that creates the SOCKS proxy connection.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-900 text-green-400 p-4 rounded-lg text-sm relative font-mono">
                  <pre className="whitespace-pre-wrap break-all">{dbLibCode}</pre>
                  <Button
                    variant="outline"
                    size="sm"
                    className="absolute top-2 right-2 bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700"
                    onClick={() => copyToClipboard(dbLibCode)}
                  >
                    <Copy className="w-4 h-4" />
                    {copied ? "Copied!" : "Copy"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Configuration Checklist</CardTitle>
                <CardDescription>Ensure these three components are correctly configured.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="bg-blue-100 text-blue-800 rounded-full w-8 h-8 flex-shrink-0 flex items-center justify-center font-bold">
                    1
                  </div>
                  <div>
                    <h4 className="font-semibold">Vercel Environment Variable</h4>
                    <p className="text-sm text-gray-600">
                      The `FIXIE_SOCKS_HOST` variable must be set in your Vercel project with the full URL from your
                      Fixie dashboard.
                    </p>
                    <code className="text-xs bg-gray-100 p-1 rounded mt-1 inline-block">
                      fixie:username:password@host.usefixie.com:1080
                    </code>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="bg-blue-100 text-blue-800 rounded-full w-8 h-8 flex-shrink-0 flex items-center justify-center font-bold">
                    2
                  </div>
                  <div>
                    <h4 className="font-semibold">Azure SQL Firewall Rules</h4>
                    <p className="text-sm text-gray-600">
                      Both of your Fixie static IP addresses must be whitelisted in the Azure SQL Server firewall.
                    </p>
                    <div className="text-xs mt-1 space-y-1">
                      <code className="bg-gray-100 p-1 rounded block">3.224.144.155</code>
                      <code className="bg-gray-100 p-1 rounded block">3.223.196.67</code>
                    </div>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="bg-blue-100 text-blue-800 rounded-full w-8 h-8 flex-shrink-0 flex items-center justify-center font-bold">
                    3
                  </div>
                  <div>
                    <h4 className="font-semibold">Package Dependencies</h4>
                    <p className="text-sm text-gray-600">Your `package.json` must include `mssql` and `socks`.</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Verify Connection</CardTitle>
                <CardDescription>
                  You can run the connection diagnostics at any time to confirm the proxy is working correctly.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/diagnostics">
                  <Button>
                    <Terminal className="w-4 h-4 mr-2" />
                    Run Connection Diagnostics
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
