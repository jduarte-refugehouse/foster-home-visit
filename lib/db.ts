import sql from "mssql"
import { DefaultAzureCredential } from "@azure/identity"
import { SecretClient } from "@azure/keyvault-secrets"
import { SocksClient } from "socks"
import type net from "net"

// Database configuration
const config = {
  server: process.env.DATABASE_SERVER || "refugehouse-bifrost-server.database.windows.net",
  database: process.env.DATABASE_NAME || "RefugeHouse-Bifrost",
  port: Number.parseInt(process.env.DATABASE_PORT || "1433"),
  options: {
    encrypt: true,
    trustServerCertificate: false,
    enableArithAbort: true,
    connectTimeout: 30000,
    requestTimeout: 30000,
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
}

let pool: sql.ConnectionPool | null = null
let isConnecting = false

// Azure Key Vault configuration
const keyVaultName = process.env.AZURE_KEY_VAULT_NAME || "refugehouse-kv"
const keyVaultUrl = `https://${keyVaultName}.vault.azure.net/`

async function getPasswordFromKeyVault(): Promise<string> {
  try {
    console.log("🔑 Attempting to retrieve password from Azure Key Vault...")
    console.log(`🔑 Key Vault URL: ${keyVaultUrl}`)

    const credential = new DefaultAzureCredential()
    const client = new SecretClient(keyVaultUrl, credential)

    const secretName = "database-password"
    const secret = await client.getSecret(secretName)

    if (!secret.value) {
      throw new Error("Password secret is empty")
    }

    console.log("✅ Successfully retrieved password from Key Vault")
    return secret.value
  } catch (error) {
    console.error("❌ Error retrieving password from Key Vault:", error)
    throw error
  }
}

async function createSocksConnection(): Promise<net.Socket> {
  const proxyUrl = process.env.QUOTAGUARD_URL || process.env.PROXY_URL || process.env.FIXIE_SOCKS_HOST

  if (!proxyUrl) {
    throw new Error("No SOCKS proxy URL configured")
  }

  console.log("Using Fixie SOCKS proxy for connection.")

  // Parse the proxy URL
  const url = new URL(proxyUrl)
  const proxyHost = url.hostname
  const proxyPort = Number.parseInt(url.port) || 1080
  const username = url.username
  const password = url.password

  console.log(`Attempting SOCKS connection via ${proxyHost}:${proxyPort}`)

  const socksOptions = {
    proxy: {
      host: proxyHost,
      port: proxyPort,
      type: 5 as const,
      userId: username,
      password: password,
    },
    command: "connect" as const,
    destination: {
      host: config.server,
      port: config.port,
    },
  }

  const info = await SocksClient.createConnection(socksOptions)
  console.log("SOCKS connection established. Initiating TLS handshake...")

  return info.socket
}

export async function getConnection(): Promise<sql.ConnectionPool> {
  if (pool && pool.connected) {
    return pool
  }

  if (isConnecting) {
    // Wait for the existing connection attempt
    while (isConnecting) {
      await new Promise((resolve) => setTimeout(resolve, 100))
    }
    if (pool && pool.connected) {
      return pool
    }
  }

  isConnecting = true

  try {
    console.log("🔌 Attempting new connection to refugehouse-bifrost-server.database.windows.net...")

    // Get password from Azure Key Vault
    const password = await getPasswordFromKeyVault()
    console.log("🔑 Password source: Azure Key Vault")

    // Create SOCKS connection
    const socket = await createSocksConnection()

    // Configure SQL connection with SOCKS proxy
    const connectionConfig = {
      ...config,
      user: process.env.DATABASE_USER || "refugehouse-admin",
      password: password,
      stream: socket,
    }

    pool = new sql.ConnectionPool(connectionConfig)

    pool.on("error", (err) => {
      console.error("Database pool error:", err)
      pool = null
    })

    await pool.connect()
    console.log("TLS handshake successful. Socket is authorized.")
    console.log("✅ Database connection successful.")

    return pool
  } catch (error) {
    console.error("❌ Database connection failed:", error)
    pool = null
    throw error
  } finally {
    isConnecting = false
  }
}

export async function query<T = any>(text: string, params?: any[]): Promise<T[]> {
  try {
    const connection = await getConnection()
    const request = connection.request()

    // Add parameters if provided
    if (params) {
      params.forEach((param, index) => {
        request.input(`param${index}`, param)
      })
    }

    const result = await request.query(text)
    return result.recordset
  } catch (error) {
    console.error("Query error:", error)
    throw error
  }
}

export async function testConnection(): Promise<boolean> {
  try {
    await getConnection()
    const result = await query("SELECT 1 as test")
    return result.length > 0 && result[0].test === 1
  } catch (error) {
    console.error("Connection test failed:", error)
    return false
  }
}

export async function closeConnection(): Promise<void> {
  if (pool) {
    try {
      await pool.close()
      pool = null
      console.log("Database connection closed")
    } catch (error) {
      console.error("Error closing database connection:", error)
    }
  }
}

// Alias for compatibility
export const getDbConnection = getConnection
