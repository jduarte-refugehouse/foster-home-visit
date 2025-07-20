import sql from "mssql"
import Agent from "proxy-agent"

// --- The Fix ---
// Instantiate the proxy agent. This automatically monkey-patches the global
// networking modules (like `net` and `http`) to route all outbound TCP
// connections through the proxy defined in the environment variables.
// It will automatically pick up and use your `FIXIE_URL`.
new Agent()
// ---------------

let pool: sql.ConnectionPool | null = null

function getConfig(): sql.config {
  // The configuration is now much simpler. We don't need to manually
  // configure the proxy here because `proxy-agent` handles it globally.
  const config: sql.config = {
    server: "refugehouse-bifrost-server.database.windows.net",
    database: "RadiusBifrost",
    user: "v0_app_user",
    password: "M7w!vZ4#t8LcQb1R",
    pool: {
      max: 10,
      min: 0,
      idleTimeoutMillis: 30000,
    },
    options: {
      encrypt: true, // Encryption is required for Azure SQL
      trustServerCertificate: false,
      connectTimeout: 45000, // Increased timeout for proxy connections
      requestTimeout: 45000,
    },
  }

  if (process.env.FIXIE_URL) {
    console.log("✅ Fixie proxy is configured. All TCP connections will be routed through it.")
  } else {
    console.warn("⚠️ WARNING: FIXIE_URL is not set. Database connection will likely fail.")
  }

  return config
}

export async function getConnection(): Promise<sql.ConnectionPool> {
  if (pool && pool.connected) {
    return pool
  }

  // If the pool exists but is not connected, close it before creating a new one.
  if (pool) {
    console.log("Stale connection pool found. Closing it.")
    await pool.close().catch((err) => console.error("Error closing stale pool:", err))
    pool = null
  }

  try {
    const config = getConfig()
    console.log(`🔌 Attempting new connection to ${config.server}...`)

    pool = new sql.ConnectionPool(config)

    pool.on("error", (err) => {
      console.error("❌ Database Pool Error:", err)
      // On error, close the pool and set it to null to force reconnection.
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
    pool = null // Ensure pool is null on failure
    throw error
  }
}

export async function query<T = any>(queryText: string, params: any[] = []): Promise<T[]> {
  try {
    const connection = await getConnection()
    const request = connection.request()

    if (params) {
      params.forEach((param, index) => {
        request.input(`param${index}`, param)
      })
    }

    const result = await request.query(queryText)
    return result.recordset
  } catch (error) {
    console.error("❌ Query execution failed:", error)
    // If a query fails, it might be due to a connection issue.
    // Force a reconnection on the next attempt.
    if (pool) {
      await pool.close()
      pool = null
    }
    throw error
  }
}

export async function testConnection(): Promise<{ success: boolean; message: string; data?: any[] }> {
  try {
    const result = await query("SELECT 1 as test, GETDATE() as current_time")
    return {
      success: true,
      message: "Database connection successful",
      data: result,
    }
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error during connection test",
    }
  }
}

export async function healthCheck(): Promise<boolean> {
  const result = await testConnection()
  return result.success
}

export async function forceReconnect(): Promise<void> {
  if (pool) {
    await pool.close()
    pool = null
  }
  console.log("🔄 Connection pool has been forcefully closed.")
}

export function getConnectionInfo(): any {
  const config = getConfig()
  return {
    server: config.server,
    database: config.database,
    proxyConfigured: !!process.env.FIXIE_URL,
    poolConnected: pool?.connected || false,
  }
}
