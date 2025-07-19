import { SecretClient } from "@azure/keyvault-secrets"
import { ClientSecretCredential } from "@azure/identity"
import sql from "mssql"

let pool: sql.ConnectionPool | null = null

async function getConnectionString(): Promise<string> {
  try {
    const credential = new ClientSecretCredential(
      process.env.AZURE_TENANT_ID!,
      process.env.AZURE_CLIENT_ID!,
      process.env.AZURE_CLIENT_SECRET!,
    )

    const vaultUrl = `https://${process.env.AZURE_KEY_VAULT_NAME}.vault.azure.net`
    const client = new SecretClient(vaultUrl, credential)

    const secret = await client.getSecret("v0-db-connection-string")
    return secret.value || ""
  } catch (error) {
    console.error("Failed to get connection string from Key Vault:", error)
    throw error
  }
}

// Get database configuration with proxy support
function getConfig(): sql.config {
  const baseConfig: sql.config = {
    user: "v0_app_user",
    password: "M7w!vZ4#t8LcQb1R",
    database: "RadiusBifrost",
    server: "refugehouse-bifrost-server.database.windows.net",
    pool: {
      max: 10,
      min: 0,
      idleTimeoutMillis: 30000,
    },
    options: {
      encrypt: true,
      trustServerCertificate: false,
      enableArithAbort: true,
      connectTimeout: 30000,
      requestTimeout: 30000,
      useUTC: true,
      abortTransactionOnError: true,
    },
  }

  // Check for proxy configuration (Fixie, QuotaGuard, or generic proxy)
  const proxyUrl = process.env.FIXIE_URL || process.env.QUOTAGUARD_URL || process.env.PROXY_URL

  if (proxyUrl) {
    console.log("🔗 Proxy URL detected:", proxyUrl.replace(/\/\/.*@/, "//***:***@"))

    try {
      // Parse the proxy URL
      const url = new URL(proxyUrl)
      const proxyHost = url.hostname
      const proxyPort = Number.parseInt(url.port) || (url.protocol === "https:" ? 443 : 80)
      const proxyAuth = url.username && url.password ? `${url.username}:${url.password}` : undefined

      console.log("🔧 Proxy configuration:")
      console.log("  - Host:", proxyHost)
      console.log("  - Port:", proxyPort)
      console.log("  - Protocol:", url.protocol)
      console.log("  - Auth configured:", !!proxyAuth)

      // For HTTP proxies (like Fixie), try setting environment variables
      // This is a workaround since mssql doesn't directly support proxy configuration
      if (url.protocol === "http:" && proxyAuth) {
        // Set proxy environment variables that some libraries respect
        process.env.HTTP_PROXY = proxyUrl
        process.env.HTTPS_PROXY = proxyUrl
        process.env.http_proxy = proxyUrl
        process.env.https_proxy = proxyUrl

        console.log("🔧 Set HTTP_PROXY environment variables")
      }

      // Try to configure proxy in options (may not work with all versions)
      if (baseConfig.options) {
        // Some versions of mssql support proxy configuration
        try {
          ;(baseConfig.options as any).proxy = {
            host: proxyHost,
            port: proxyPort,
            auth: proxyAuth,
          }
          console.log("🔧 Added proxy to connection options")
        } catch (error) {
          console.log("⚠️ Could not add proxy to connection options:", error)
        }
      }

      console.log("✅ Proxy configuration applied")
    } catch (error) {
      console.error("❌ Failed to configure proxy:", error)
    }
  } else {
    console.log("⚠️ No proxy configured - using direct connection")
    console.log("🔍 Available proxy env vars:", {
      FIXIE_URL: !!process.env.FIXIE_URL,
      QUOTAGUARD_URL: !!process.env.QUOTAGUARD_URL,
      PROXY_URL: !!process.env.PROXY_URL,
    })
  }

  return baseConfig
}

export async function getConnection(): Promise<sql.ConnectionPool> {
  // If pool exists but is closed, reset it
  if (pool && !pool.connected) {
    console.log("Pool exists but is not connected, resetting...")
    try {
      await pool.close()
    } catch (error) {
      console.log("Error closing existing pool:", error)
    }
    pool = null
  }

  if (!pool) {
    try {
      const config = getConfig()

      console.log("🔌 Attempting database connection:")
      console.log("  - Server:", config.server)
      console.log("  - Database:", config.database)
      console.log("  - User:", config.user)
      console.log("  - Encryption:", config.options?.encrypt)
      console.log(
        "  - Proxy configured:",
        !!(process.env.FIXIE_URL || process.env.QUOTAGUARD_URL || process.env.PROXY_URL),
      )

      pool = new sql.ConnectionPool(config)

      // Add event listeners for better debugging
      pool.on("connect", () => {
        console.log("✅ Database pool connected successfully")
      })

      pool.on("error", (err) => {
        console.error("❌ Database pool error:", err)
        pool = null // Reset pool on error
      })

      pool.on("close", () => {
        console.log("🔒 Database pool connection closed")
        pool = null
      })

      await pool.connect()
      console.log("✅ Database connected successfully")
    } catch (err) {
      console.error("❌ Database connection failed:", err)
      pool = null // Reset pool on failure
      throw err
    }
  }

  return pool
}

export async function query(queryText: string, params: any[] = []): Promise<any[]> {
  let retries = 3
  let lastError: Error | null = null

  while (retries > 0) {
    try {
      console.log(`🔍 Executing query (attempt ${4 - retries}/3):`, queryText.substring(0, 100) + "...")

      const connection = await getConnection()

      // Check if connection is still valid before using it
      if (!connection.connected) {
        console.log("⚠️ Connection not active, forcing reconnection...")
        pool = null
        throw new Error("Connection not active")
      }

      const request = connection.request()

      // Add parameters if provided
      params.forEach((param, index) => {
        request.input(`param${index}`, param)
      })

      const result = await request.query(queryText)
      console.log("✅ Query executed successfully, returned", result.recordset.length, "rows")

      return result.recordset
    } catch (error) {
      lastError = error as Error
      console.error(`❌ Query attempt failed (${4 - retries}/3):`, error)

      // Reset pool on any connection-related errors
      if (
        error instanceof Error &&
        (error.message.includes("Connection is closed") ||
          error.message.includes("Connection not active") ||
          error.message.includes("socket hang up") ||
          error.message.includes("ECONNRESET") ||
          error.message.includes("timeout") ||
          error.message.includes("dns.lookup") ||
          error.message.includes("unenv"))
      ) {
        console.log("🔄 Connection error detected, resetting pool...")
        if (pool) {
          try {
            await pool.close()
          } catch (closeError) {
            console.log("Error closing pool:", closeError)
          }
        }
        pool = null
      }

      retries--
      if (retries > 0) {
        const delay = (4 - retries) * 1000 // Increasing delay: 1s, 2s, 3s
        console.log(`⏳ Retrying in ${delay}ms... (${retries} attempts remaining)`)
        await new Promise((resolve) => setTimeout(resolve, delay))
      }
    }
  }

  throw lastError || new Error("Query failed after all retries")
}

// Test database connection with retry logic
export async function testConnection(): Promise<{ success: boolean; message: string; data?: any[] }> {
  try {
    console.log("🧪 Starting connection test...")
    const result = await query(`
      SELECT 
        1 as test, 
        GETDATE() as current_time, 
        DB_NAME() as database_name,
        USER_NAME() as current_user,
        @@SERVERNAME as server_name
    `)

    console.log("✅ Connection test successful")
    return {
      success: true,
      message: "Database connection successful",
      data: result,
    }
  } catch (error) {
    console.error("❌ Database connection test failed:", error)
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

// Close connection pool gracefully
export async function closeConnection(): Promise<void> {
  if (pool) {
    try {
      console.log("🔒 Closing database connection pool...")
      await pool.close()
      console.log("✅ Database connection pool closed successfully")
    } catch (error) {
      console.error("❌ Error closing database connection pool:", error)
    } finally {
      pool = null
    }
  }
}

// Health check function
export async function healthCheck(): Promise<boolean> {
  try {
    console.log("🏥 Running health check...")
    const result = await testConnection()
    console.log("🏥 Health check result:", result.success ? "✅ Healthy" : "❌ Unhealthy")
    return result.success
  } catch (error) {
    console.error("❌ Health check failed:", error)
    return false
  }
}

// Force reconnection - useful for troubleshooting
export async function forceReconnect(): Promise<void> {
  console.log("🔄 Forcing reconnection...")
  if (pool) {
    try {
      await pool.close()
    } catch (error) {
      console.log("Error closing pool during force reconnect:", error)
    }
  }
  pool = null
  console.log("Pool reset, next query will create new connection")
}

// Get connection configuration info for debugging
export function getConnectionInfo(): any {
  const config = getConfig()
  const proxyUrl = process.env.FIXIE_URL || process.env.QUOTAGUARD_URL || process.env.PROXY_URL

  return {
    server: config.server,
    database: config.database,
    user: config.user,
    encrypt: config.options?.encrypt,
    usingProxyAgent: !!config.options?.agent,
    usingHttpProxy: !!(config.options as any)?.proxy,
    proxyConfigured: !!proxyUrl,
    proxyUrl: proxyUrl ? proxyUrl.replace(/\/\/.*@/, "//***:***@") : null,
    proxyType: proxyUrl ? (proxyUrl.startsWith("http:") ? "HTTP" : "HTTPS") : null,
    poolConnected: pool?.connected || false,
    poolExists: !!pool,
    environmentVariables: {
      FIXIE_URL: !!process.env.FIXIE_URL,
      QUOTAGUARD_URL: !!process.env.QUOTAGUARD_URL,
      PROXY_URL: !!process.env.PROXY_URL,
      HTTP_PROXY: !!process.env.HTTP_PROXY,
    },
  }
}
