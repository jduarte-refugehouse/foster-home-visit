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
    return { success: false, message: `Database health check failed: ${error.message}` }
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
