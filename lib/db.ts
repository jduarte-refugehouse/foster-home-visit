import sql from "mssql"
import type net from "net"
import tls from "tls"
import { SocksClient } from "socks"
import { SecretClient } from "@azure/keyvault-secrets"
import { ClientSecretCredential } from "@azure/identity"

let pool: sql.ConnectionPool | null = null

// ⚠️⚠️⚠️ CRITICAL WARNING ⚠️⚠️⚠️
// DO NOT CHANGE THE DATABASE CONNECTION PARAMETERS BELOW WITHOUT EXPLICIT USER PERMISSION
// THESE PARAMETERS ARE LOCKED AND WORKING
// CHANGING THEM WILL BREAK THE APPLICATION
// IF YOU CHANGE THESE, YOU WILL HAVE TO BREAK YOUR OWN FINGERS
// ⚠️⚠️⚠️ END WARNING ⚠️⚠️⚠️

// Azure Key Vault client setup
async function getPasswordFromKeyVault(): Promise<{ password: string; source: string; error?: string }> {
  try {
    console.log("🔑 Attempting to retrieve password from Azure Key Vault...")

    const credential = new ClientSecretCredential(
      process.env.AZURE_TENANT_ID!,
      process.env.AZURE_CLIENT_ID!,
      process.env.AZURE_CLIENT_SECRET!,
    )

    const keyVaultUrl = `https://${process.env.AZURE_KEY_VAULT_NAME}.vault.azure.net/`
    console.log(`🔑 Key Vault URL: ${keyVaultUrl}`)

    const client = new SecretClient(keyVaultUrl, credential)
    const secret = await client.getSecret("database-password")

    console.log("✅ Successfully retrieved password from Key Vault")
    return {
      password: secret.value!,
      source: "Azure Key Vault",
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    console.error("❌ Failed to retrieve password from Key Vault:", errorMessage)
    console.log("🔄 Falling back to hardcoded password")

    return {
      password: "M7w!vZ4#t8LcQb1R",
      source: "Fallback (hardcoded)",
      error: errorMessage,
    }
  }
}

// Custom connector function for Fixie SOCKS proxy
function createFixieConnector(config: sql.config) {
  return new Promise<net.Socket>((resolve, reject) => {
    if (!process.env.FIXIE_SOCKS_HOST) {
      return reject(new Error("FIXIE_SOCKS_HOST environment variable not set."))
    }
    const fixieUrl = process.env.FIXIE_SOCKS_HOST

    // This regex is designed for the format: socks://user:password@host:port
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

// Store password source for diagnostics
let lastPasswordSource = ""
let lastPasswordError = ""

export async function getConnection(): Promise<sql.ConnectionPool> {
  if (pool && pool.connected) {
    return pool
  }
  if (pool) {
    await pool.close().catch((err) => console.error("Error closing stale pool:", err))
  }

  // Get password from Azure Key Vault
  const passwordResult = await getPasswordFromKeyVault()
  lastPasswordSource = passwordResult.source
  lastPasswordError = passwordResult.error || ""

  // ⚠️⚠️⚠️ THESE ARE THE CORRECT, WORKING, LOCKED DATABASE PARAMETERS ⚠️⚠️⚠️
  // DO NOT CHANGE THESE WITHOUT EXPLICIT USER PERMISSION
  // THESE PARAMETERS WORK AND ARE STABLE
  const config: sql.config = {
    user: "v0_app_user",
    password: passwordResult.password, // Now retrieved securely from Key Vault
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
  // ⚠️⚠️⚠️ END LOCKED PARAMETERS ⚠️⚠️⚠️

  if (process.env.FIXIE_SOCKS_HOST) {
    console.log("Using Fixie SOCKS proxy for connection.")
    config.options.connector = () => createFixieConnector(config)
  } else {
    console.warn("⚠️ No Fixie proxy detected. Attempting direct connection.")
  }
  try {
    console.log(`🔌 Attempting new connection to ${config.server}...`)
    console.log(`🔑 Password source: ${lastPasswordSource}`)
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

export async function closeConnection() {
  if (pool && pool.connected) {
    await pool.close()
    pool = null
    console.log("Database connection closed.")
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

export async function testConnection(): Promise<{
  success: boolean
  message: string
  data?: any[]
  passwordSource?: string
  passwordError?: string
}> {
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
      passwordSource: lastPasswordSource,
      passwordError: lastPasswordError,
    }
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error during connection test.",
      passwordSource: lastPasswordSource,
      passwordError: lastPasswordError,
    }
  }
}
