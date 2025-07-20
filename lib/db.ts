// IMPORTANT: This line MUST be at the top to patch Node.js internals
import "global-socks/cjs/register"

import sql from "mssql"

// Set the SOCKS_PROXY environment variable for global-socks to use.
// This allows the user to keep their FIXIE_SOCKS_HOST or FIXIE_URL variable.
const fixieEnvVar = process.env.FIXIE_SOCKS_HOST || process.env.FIXIE_URL

if (fixieEnvVar) {
  if (!process.env.SOCKS_PROXY) {
    let proxyUrl = fixieEnvVar
    // The global-socks library expects SOCKS_PROXY format: socks://[user:password@]host:port
    // The fixie URL is `fixie:user@host:port`. We need to convert it.
    if (proxyUrl.startsWith("fixie:")) {
      proxyUrl = "socks://" + proxyUrl.substring(6)
    }
    process.env.SOCKS_PROXY = proxyUrl
    console.log("✅ global-socks proxy configured using Fixie environment variable.")
  }
} else {
  console.warn("⚠️ No Fixie proxy URL (FIXIE_SOCKS_HOST or FIXIE_URL) is set. Direct connection will be attempted.")
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
      connectTimeout: 60000,
      requestTimeout: 60000,
    },
  }
  // No more agent configuration needed here.
  // global-socks patches the underlying 'net' module.
  return config
}

export async function getConnection(): Promise<sql.ConnectionPool> {
  if (pool && pool.connected) {
    return pool
  }

  if (pool) {
    await pool.close().catch((err) => console.error("Error closing stale pool:", err))
    pool = null
  }

  try {
    const config = getConfig()
    console.log(`🔌 Attempting new connection to ${config.server} via global SOCKS proxy...`)

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
      message: "Database connection successful via SOCKS proxy.",
      data: result,
    }
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error during connection test.",
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
