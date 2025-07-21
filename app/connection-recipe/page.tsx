"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Copy, Check } from "lucide-react"

export default function ConnectionRecipePage() {
  const [copiedCode, setCopiedCode] = useState(false)
  const [copiedConfig, setCopiedConfig] = useState(false)

  const codeSnippet = `
// lib/db.ts
import sql from "mssql"
import { SocksProxyAgent } from "socks-proxy-agent"

// This function parses the Fixie SOCKS proxy URL and returns the host, port, username, and password.
function parseFixieUrl(fixieUrl: string) {
  const match = fixieUrl.match(/^(?:socks(?:5|4)?:\/\/)?([^:]+):([^@]+)@([^:]+):(\\d+)/)
  if (!match) {
    throw new Error("Invalid Fixie URL format. Expected socks://user:password@host:port")
  }
  const [, username, password, host, port] = match
  return { username, password, host, port: parseInt(port, 10) }
}

// Connection configuration for Azure SQL Database
const config: sql.config = {
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  server: process.env.POSTGRES_HOST || "localhost",
  database: process.env.POSTGRES_DATABASE,
  options: {
    encrypt: true, // Use true for Azure SQL Database to enforce encryption
    trustServerCertificate: false, // Change to true for local dev / self-signed certs
  },
}

// If FIXIE_SOCKS_HOST is provided, configure the agent
if (process.env.FIXIE_SOCKS_HOST) {
  try {
    const { username, password, host, port } = parseFixieUrl(process.env.FIXIE_SOCKS_HOST)
    const proxy = \`socks://\${username}:\${password}@\${host}:\${port}\`
    const agent = new SocksProxyAgent(proxy)
    ;(config as any).options.agent = agent
    console.log("Using Fixie SOCKS proxy for database connection.")
  } catch (error) {
    console.error("Failed to parse FIXIE_SOCKS_HOST or create proxy agent:", error)
  }
} else {
  console.log("FIXIE_SOCKS_HOST not set. Connecting directly to the database.")
}

let pool: sql.ConnectionPool | null = null

export async function getConnection() {
  if (pool && pool.connected) {
    return pool
  }

  try {
    pool = await sql.connect(config)
    console.log("Database connected successfully!")
    return pool
  } catch (err) {
    console.error("Database connection failed:", err)
    throw err
  }
}

export async function closeConnection() {
  if (pool && pool.connected) {
    await pool.close()
    console.log("Database connection closed.")
  }
}
`

  const envConfig = `
POSTGRES_USER=your_db_username
POSTGRES_PASSWORD=your_db_password
POSTGRES_HOST=your_db_server.database.windows.net
POSTGRES_DATABASE=your_db_name
FIXIE_SOCKS_HOST=socks://fixie:YOUR_FIXIE_KEY@socks.fixie.ai:5183
`

  const handleCopyCode = () => {
    navigator.clipboard.writeText(codeSnippet)
    setCopiedCode(true)
    setTimeout(() => setCopiedCode(false), 2000)
  }

  const handleCopyConfig = () => {
    navigator.clipboard.writeText(envConfig)
    setCopiedConfig(true)
    setTimeout(() => setCopiedConfig(false), 2000)
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-center mb-8">Connection Recipe: Azure SQL with Fixie Proxy</h1>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>1. `lib/db.ts` Code</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            This code snippet demonstrates how to configure `mssql` to connect to your Azure SQL Database, optionally
            routing the connection through a Fixie SOCKS proxy if `FIXIE_SOCKS_HOST` is set in your environment
            variables.
          </p>
          <div className="relative bg-gray-100 dark:bg-gray-800 p-4 rounded-md overflow-x-auto text-sm font-mono">
            <pre className="whitespace-pre-wrap">{codeSnippet}</pre>
            <Button variant="ghost" size="sm" className="absolute top-2 right-2" onClick={handleCopyCode}>
              {copiedCode ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
              <span className="sr-only">Copy code</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>2. Environment Variables (`.env.local` or Vercel Settings)</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            Ensure these environment variables are set in your `.env.local` file for local development and in your
            Vercel project settings for deployments. Replace placeholder values with your actual credentials.
          </p>
          <div className="relative bg-gray-100 dark:bg-gray-800 p-4 rounded-md overflow-x-auto text-sm font-mono">
            <pre className="whitespace-pre-wrap">{envConfig}</pre>
            <Button variant="ghost" size="sm" className="absolute top-2 right-2" onClick={handleCopyConfig}>
              {copiedConfig ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
              <span className="sr-only">Copy config</span>
            </Button>
          </div>
          <p className="text-muted-foreground mt-2">
            **Important:** Replace `your_db_username`, `your_db_password`, `your_db_server.database.windows.net`,
            `your_db_name`, and `YOUR_FIXIE_KEY` with your actual credentials.
          </p>
        </CardContent>
      </Card>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Next Steps</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground">
            <li>
              Ensure your Azure SQL Database firewall allows connections from Fixie's IP addresses. You can find these
              in your Fixie dashboard.
            </li>
            <li>
              Use the{" "}
              <a href="/diagnostics" className="text-blue-600 hover:underline">
                Diagnostics page
              </a>{" "}
              to test your database and proxy connections.
            </li>
            <li>
              If you encounter `ERR_PNPM_OUTDATED_LOCKFILE` during deployment, run `pnpm install` locally, then commit
              both `package.json` and `pnpm-lock.yaml` before redeploying.
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
