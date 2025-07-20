import sql from "mssql"
import { SocksProxyAgent } from "socks-proxy-agent"
import dns from "node:dns"

let pool: sql.ConnectionPool | null = null
let dbServerIp: string | null = null

const DB_HOST = "refugehouse-bifrost-server.database.windows.net"

/**
 * Resolves the database hostname to an IP address using a SOCKS proxy.
 * This is necessary because direct DNS lookups can fail in some serverless environments.
 * The result is cached to avoid repeated lookups.
 */
async function getDbServerIp(agent: SocksProxyAgent): Promise<string> {
  if (dbServerIp) {
    return dbServerIp
  }

  console.log(`🔍 Resolving DNS for ${DB_HOST} through SOCKS proxy...`)

  return new Promise((resolve, reject) => {
    // Use the agent's internal mechanism to perform a DNS lookup.
    // This is an undocumented but effective way to resolve DNS through the proxy.
    const lookup = (
      hostname: string,
      options: any,
      callback: (err: Error | null, address: string, family: number) => void,
    ) => {
      // The agent's `connect` method handles the DNS resolution.
      // We can piggyback on it without actually establishing a full connection.
      const socket = agent.connect({ host: hostname, port: 443 }, (err?: Error) => {
        if (err) {
          return callback(err, "", 0)
        }
      })

      socket.on("error", (err) => {
        reject(new Error(`SOCKS DNS lookup failed: ${err.message}`))
      })

      // The 'proxyconnect' event gives us the resolved IP address.
      socket.on("proxyconnect", (res: any) => {
        if (res.socket?._peername?.address) {
          const resolvedIp = res.socket._peername.address
          console.log(`✅ DNS for ${DB_HOST} resolved to ${resolvedIp}`)
          dbServerIp = resolvedIp
          callback(null, resolvedIp, 4)
        } else {
          reject(new Error("Failed to get resolved IP from proxy response."))
        }
        socket.destroy()
      })
    }

    // We call dns.lookup with our custom lookup function.
    dns.lookup(DB_HOST, { lookup }, (err, address) => {
      if (err) {
        reject(err)
      } else {
        resolve(address)
      }
    })
  })
}

async function getConfig(): Promise<sql.config> {
  const fixieUrl = process.env.FIXIE_SOCKS_HOST || process.env.FIXIE_URL
  if (!fixieUrl) {
    throw new Error("FIXIE_SOCKS_HOST or FIXIE_URL environment variable is not set.")
  }

  const agent = new SocksProxyAgent(fixieUrl)
  const resolvedIp = await getDbServerIp(agent)

  const config: sql.config = {
    server: resolvedIp, // Connect directly to the resolved IP
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
      trustServerCertificate: true, // MUST be true when connecting by IP
      connectTimeout: 60000,
      requestTimeout: 60000,
      // The agent is still needed for the actual TCP connection
      agent: agent,
    },
  }

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
    const config = await getConfig()
    console.log(`🔌 Attempting new connection to ${DB_HOST} (at ${config.server}) via SOCKS proxy...`)

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
