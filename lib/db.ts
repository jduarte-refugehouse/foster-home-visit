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
    const match = fixieUrl.match(/(?:socks:\/\/)?([^:]+):([^@]+)@([^:]+):(\d+)/)

    if (!match) {
      return reject(new Error("Invalid FIXIE_SOCKS_HOST format. Expected: user:password@host:port"))
    }

    const [, userId, password, host, port] = match

    console.log(`Attempting SOCKS connection via ${host}:${port}`)

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
    user: "v0_app_user",
    password: "M7w!vZ4#t8LcQb1R",
    database: "RadiusBifrost",
    server: "refugehouse-bifrost-server.database.windows.net",
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
    const result = await query(`
      SELECT 
        SUSER_SNAME() as login_name, 
        DB_NAME() as db_name,
        CONNECTIONPROPERTY('client_net_address') as client_ip
    `)
    return {
      success: true,
      message: "Database connection successful.",
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
