"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, CheckCircle, Copy, FileCode, Terminal } from "lucide-react"
import Link from "next/link"

export default function ConnectionRecipe() {
  const [copiedCode, setCopiedCode] = useState(false)
  const [copiedEnv, setCopiedEnv] = useState(false)

  // This code snippet now accurately reflects the lib/db.ts content, using environment variables
  const dbLibCode = `
// lib/db.ts
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

export async function getConnection(): Promise<sql.ConnectionPool> {
  if (pool && pool.connected) {
    return pool
  }
  if (pool) {
    await pool.close().catch((err) => console.error("Error closing stale pool:", err))
  }

  const config: sql.config = {
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    database: process.env.POSTGRES_DATABASE,
    server: process.env.POSTGRES_HOST || "",
    port: 1433,
    pool: { max: 10, min: 0, idleTimeoutMillis: 30000 },
    options: {
      encrypt: true,
      trustServerCertificate: false,
      connectTimeout: 60000,
      requestTimeout: 60000,
    },
  }

  if (!config.server || !config.user || !config.password || !config.database) {
    throw new Error("Database environment variables are not fully configured.")
  }

  if (process.env.FIXIE_SOCKS_HOST) {
    console.log("Using Fixie SOCKS proxy for connection.")
    config.options.connector = () => createFixieConnector(config)
  }

  try {
    pool = new sql.ConnectionPool(config)
    await pool.connect()
    return pool
  } catch (error) {
    pool = null
    throw error
  }
}

// The query, testConnection, healthCheck, and forceReconnect functions would follow here.
// For brevity in the recipe, we focus on the core connection setup.
`

  const envFileContent = `
# Vercel Environment Variables

# Database Credentials
POSTGRES_HOST=your_db_server.database.windows.net
POSTGRES_DATABASE=your_db_name
POSTGRES_USER=your_db_username
POSTGRES_PASSWORD=your_db_password

# Fixie Proxy URL
FIXIE_SOCKS_HOST=socks://fixie:YOUR_FIXIE_KEY@socks.fixie.ai:5183
`

  const copyToClipboard = (text: string, type: "code" | "env") => {
    navigator.clipboard.writeText(text)
    if (type === "code") {
      setCopiedCode(true)
      setTimeout(() => setCopiedCode(false), 2000)
    } else {
      setCopiedEnv(true)
      setTimeout(() => setCopiedEnv(false), 2000)
    }
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
                <CardTitle>1. Environment Variables</CardTitle>
                <CardDescription>Set these variables in your Vercel project settings.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-900 text-green-400 p-4 rounded-lg text-sm relative font-mono">
                  <pre className="whitespace-pre-wrap break-all">{envFileContent}</pre>
                  <Button
                    variant="outline"
                    size="sm"
                    className="absolute top-2 right-2 bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700"
                    onClick={() => copyToClipboard(envFileContent, "env")}
                  >
                    <Copy className="w-4 h-4" />
                    {copiedEnv ? "Copied!" : "Copy"}
                  </Button>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>2. The Code: lib/db.ts</CardTitle>
                <CardDescription>This is the exact code that creates the SOCKS proxy connection.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-900 text-green-400 p-4 rounded-lg text-sm relative font-mono">
                  <pre className="whitespace-pre-wrap break-all">{dbLibCode}</pre>
                  <Button
                    variant="outline"
                    size="sm"
                    className="absolute top-2 right-2 bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700"
                    onClick={() => copyToClipboard(dbLibCode, "code")}
                  >
                    <Copy className="w-4 h-4" />
                    {copiedCode ? "Copied!" : "Copy"}
                  </Button>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>3. Azure SQL Firewall Rules</CardTitle>
                <CardDescription>
                  Whitelist both of your Fixie static IP addresses in the Azure SQL Server firewall.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-sm mt-1 space-y-1">
                  <code className="bg-gray-100 p-1 rounded block">3.224.144.155</code>
                  <code className="bg-gray-100 p-1 rounded block">3.223.196.67</code>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>4. Verify Connection</CardTitle>
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
