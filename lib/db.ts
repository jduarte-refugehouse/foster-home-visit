import sql from "mssql"
import Agent from "proxy-agent"

let isProxyAgentInitialized = false

/**
 * Initializes the proxy agent. This should only be called once.
 * It patches the global networking modules to route all outbound TCP
 * connections through the proxy defined in the environment variables.
 */
function initializeProxyAgent() {
  if (!isProxyAgentInitialized) {
    console.log("Initializing proxy agent...")
    // This will automatically pick up and use your `FIXIE_URL`.
    new Agent()
    isProxyAgentInitialized = true
    console.log("✅ Proxy agent initialized.")
  }
}

let pool: sql.ConnectionPool | null = null

function getConfig(): sql.config {
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
      encrypt: true,
      trustServerCertificate: false,
      connectTimeout: 45000,
      requestTimeout: 45000,
    },
  }
  return config
}

export async function getConnection(): Promise<sql.ConnectionPool> {
  // Initialize the proxy agent on the first connection attempt.
  // This ensures it only runs in the server runtime, not during build.
  initializeProxyAgent()

  if (pool && pool.connected) {
    return pool
  }

  if (pool) {
    await pool.close().catch((err) => console.error("Error closing stale pool:", err))
    pool = null
  }

  try {
    const config = getConfig()
    console.log(`🔌 Attempting new connection to ${config.server}...`)

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
