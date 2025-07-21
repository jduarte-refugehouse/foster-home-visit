"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Copy } from "lucide-react"

export default function ConnectionRecipePage() {
  const connectionCode = `
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
    user: process.env.POSTGRES_USER || "v0_app_user",
    password: process.env.POSTGRES_PASSWORD || "M7w!vZ4#t8LcQb1R",
    database: process.env.POSTGRES_DATABASE || "RadiusBifrost",
    server: process.env.POSTGRES_HOST || "refugehouse-bifrost-server.database.windows.net",
    port: 1433,
    pool: {
      max: 10,
      min: 0,
      idleTimeoutMillis: 30000,
    },
    options: {
      encrypt: true,
      trustServerCertificate: false,
      connectTimeout: 60000,
      requestTimeout: 60000,
    },
  }

  if (process.env.FIXIE_SOCKS_HOST) {
    console.log("Using Fixie SOCKS proxy for connection.")
    config.options.connector = () => createFixieConnector(config)
  } else {
    console.warn("⚠️ No Fixie proxy detected. Attempting direct connection.")
  }

  try {
    console.log(\`🔌 Attempting new connection to \${config.server}...\`)
    pool = new sql.ConnectionPool(config)

    pool.on("error", (err) => {
      console.error("❌ Database Pool Error:", err)
      if (pool) {
        pool.close()
        pool = null
      }
    })

    await pool.connect()
    console.log("✅ Database connection successful.")
    return pool
  } catch (error) {
    console.error("❌ Failed to establish database connection:", error)
    pool = null
    throw error
  }
}

export async function query(queryString: string) {
  let pool: sql.ConnectionPool | null = null
  try {
    pool = await getConnection()
    const result = await pool.request().query(queryString)
    return { success: true, data: result.recordset }
  } catch (error: any) {
    console.error("Database query failed:", error)
    return { success: false, message: error.message || "Database query failed." }
  }
}

export async function testConnection() {
  try {
    const pool = await getConnection()
    if (pool.connected) {
      const result = await pool
        .request()
        .query(
          "SELECT SUSER_SNAME() AS login_name, DB_NAME() AS db_name, CONNECTIONPROPERTY('client_net_address') AS client_ip;",
        )
      return { success: true, message: "Successfully connected to the database.", data: result.recordset }
    } else {
      return { success: false, message: "Failed to connect to the database pool." }
    }
  } catch (error: any) {
    console.error("Database connection test failed:", error)
    return { success: false, message: error.message || "Database connection test failed." }
  }
}

export async function healthCheck() {
  try {
    const pool = await getConnection()
    if (pool.connected) {
      return { success: true, message: "Database is healthy." }
    } else {
      return { success: false, message: "Database pool is not connected." }
    }
  } catch (error: any) {
    return { success: false, message: \`Database health check failed: \${error.message}\` }
  }
}

export async function forceReconnect() {
  if (pool && pool.connected) {
    console.log("Closing existing database pool for forced reconnect.")
    await pool.close().catch((err) => console.error("Error closing pool during force reconnect:", err))
    pool = null
  }
  return getConnection()
}
`

  const copyToClipboard = (text: string) => {
    navigator.clipboard
      .writeText(text)
      .then(() => alert("Connection recipe copied to clipboard!"))
      .catch((err) => console.error("Failed to copy:", err))
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-4xl shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-gray-900 dark:text-gray-50">
            Database Connection Recipe
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 text-gray-700 dark:text-gray-300">
          <p className="text-lg">
            This page provides the full code for connecting to your Azure SQL database via the Fixie SOCKS proxy. This
            setup ensures that your database connections originate from a static IP address, simplifying firewall
            management.
          </p>

          <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-50">`lib/db.ts` Content</h2>
          <p>
            The following code snippet from `lib/db.ts` demonstrates how the MSSQL connection is established,
            incorporating the custom connector for Fixie.
          </p>
          <div className="relative bg-gray-100 dark:bg-gray-800 p-4 rounded-md font-mono text-sm overflow-x-auto">
            <pre className="whitespace-pre-wrap break-all">
              <code>{connectionCode}</code>
            </pre>
            <Button
              size="sm"
              variant="ghost"
              className="absolute top-2 right-2"
              onClick={() => copyToClipboard(connectionCode)}
              aria-label="Copy connection code to clipboard"
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>

          <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-50 mt-8">Key Configuration Details</h2>
          <ul className="list-disc list-inside space-y-2">
            <li>
              <span className="font-medium">Environment Variable:</span> The connection relies on the `FIXIE_SOCKS_HOST`
              environment variable, which should contain your Fixie proxy URL (e.g., `socks://user:password@host:port`).
            </li>
            <li>
              <span className="font-medium">Custom Connector:</span> The `createFixieConnector` function intercepts the
              connection request and routes it through the Fixie SOCKS5 proxy before establishing a TLS connection to
              your database.
            </li>
            <li>
              <span className="font-medium">Database Credentials:</span> Database user, password, database name, and
              server are configured using environment variables (`POSTGRES_USER`, `POSTGRES_PASSWORD`,
              `POSTGRES_DATABASE`, `POSTGRES_HOST`) or default values.
            </li>
            <li>
              <span className="font-medium">TLS/SSL:</span> `encrypt: true` and `trustServerCertificate: false` are set
              to enforce secure, encrypted connections and validate the server's certificate.
            </li>
          </ul>

          <div className="flex flex-col sm:flex-row justify-center gap-4 mt-8">
            <Link href="/proxy-setup">
              <Button className="w-full sm:w-auto bg-transparent" variant="outline">
                Proxy Setup Guide
              </Button>
            </Link>
            <Link href="/diagnostics">
              <Button className="w-full sm:w-auto" variant="secondary">
                Run Diagnostics
              </Button>
            </Link>
            <Link href="/">
              <Button className="w-full sm:w-auto" variant="default">
                Back to Home
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
