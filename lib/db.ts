import sql from "mssql"
import { DefaultAzureCredential } from "@azure/identity"
import { SecretClient } from "@azure/keyvault-secrets"
import { SocksProxyAgent } from "socks-proxy-agent"

// Database configuration with your locked parameters
const dbConfig = {
  user: "v0_app_user",
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
    enableArithAbort: true,
  },
  requestTimeout: 30000,
  connectionTimeout: 30000,
}

let pool: sql.ConnectionPool | null = null
let isConnecting = false

async function getPasswordFromKeyVault(): Promise<string> {
  try {
    console.log("🔑 Attempting to retrieve password from Azure Key Vault...")
    console.log("🔑 Key Vault URL: https://refugehouse-kv.vault.azure.net/")

    const credential = new DefaultAzureCredential()
    const client = new SecretClient("https://refugehouse-kv.vault.azure.net/", credential)

    const secret = await client.getSecret("refugehouse-bifrost-password")
    console.log("✅ Successfully retrieved password from Key Vault")
    return secret.value || ""
  } catch (error) {
    console.error("❌ Failed to retrieve password from Key Vault:", error)
    throw error
  }
}

function createSocksAgent(): SocksProxyAgent {
  const fixieUrl = process.env.FIXIE_SOCKS_HOST
  if (!fixieUrl) {
    throw new Error("FIXIE_SOCKS_HOST environment variable is not set")
  }

  console.log("Using Fixie SOCKS proxy for connection.")
  console.log(`Attempting SOCKS connection via ${fixieUrl}`)

  return new SocksProxyAgent(`socks5://${fixieUrl}`)
}

export async function getConnection(): Promise<sql.ConnectionPool> {
  if (pool && pool.connected) {
    return pool
  }

  if (isConnecting) {
    // Wait for existing connection attempt
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

    const password = await getPasswordFromKeyVault()
    console.log("🔑 Password source: Azure Key Vault")

    const agent = createSocksAgent()

    const config = {
      ...dbConfig,
      password,
      beforeConnect: (conn: any) => {
        conn.config.options.agent = agent
      },
    }

    pool = new sql.ConnectionPool(config)

    pool.on("connect", () => {
      console.log("SOCKS connection established. Initiating TLS handshake...")
    })

    pool.on("end", () => {
      console.log("TLS handshake successful. Socket is authorized.")
    })

    await pool.connect()
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

export async function query<T = any>(queryText: string, params?: any[]): Promise<T[]> {
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
    console.error("Query error:", error)
    throw error
  }
}

export async function testConnection(): Promise<boolean> {
  try {
    await query("SELECT 1 as test")
    return true
  } catch (error) {
    console.error("Connection test failed:", error)
    return false
  }
}

export async function closeConnection(): Promise<void> {
  if (pool) {
    await pool.close()
    pool = null
  }
}

// Alias for compatibility
export const getDbConnection = getConnection
