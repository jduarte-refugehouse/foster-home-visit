import sql from "mssql"
import { SecretClient } from "@azure/keyvault-secrets"
import { DefaultAzureCredential } from "@azure/identity"
import { SocksClient } from "socks"

// Connection lock to prevent multiple simultaneous connections
let connectionLock = false
let pool: sql.ConnectionPool | null = null

interface DatabaseConfig {
  server: string
  database: string
  user: string
  password: string
  port: number
  options: {
    encrypt: boolean
    trustServerCertificate: boolean
    enableArithAbort: boolean
    requestTimeout: number
    connectionTimeout: number
  }
}

async function getSecretFromKeyVault(secretName: string): Promise<string> {
  try {
    const keyVaultName = process.env.AZURE_KEY_VAULT_NAME
    if (!keyVaultName) {
      throw new Error("AZURE_KEY_VAULT_NAME environment variable is not set")
    }

    const url = `https://${keyVaultName}.vault.azure.net`
    const credential = new DefaultAzureCredential()
    const client = new SecretClient(url, credential)

    const secret = await client.getSecret(secretName)
    if (!secret.value) {
      throw new Error(`Secret ${secretName} has no value`)
    }

    return secret.value
  } catch (error) {
    console.error(`Error retrieving secret ${secretName}:`, error)
    throw error
  }
}

async function createSocksConnection(): Promise<any> {
  const fixieUrl = process.env.FIXIE_SOCKS_HOST
  if (!fixieUrl) {
    throw new Error("FIXIE_SOCKS_HOST environment variable is not set")
  }

  // Parse the Fixie SOCKS URL
  const url = new URL(fixieUrl)
  const [username, password] = url.username ? [url.username, url.password] : ["", ""]

  const socksOptions = {
    proxy: {
      host: url.hostname,
      port: Number.parseInt(url.port) || 1080,
      type: 5 as const,
      userId: username,
      password: password,
    },
    command: "connect" as const,
    destination: {
      host: await getSecretFromKeyVault("db-server"),
      port: 1433,
    },
  }

  console.log("Creating SOCKS connection through Fixie...")
  const info = await SocksClient.createConnection(socksOptions)
  console.log("SOCKS connection established")

  return info.socket
}

async function getDatabaseConfig(): Promise<DatabaseConfig> {
  try {
    console.log("Retrieving database configuration...")

    const [server, database, user, password] = await Promise.all([
      getSecretFromKeyVault("db-server"),
      getSecretFromKeyVault("db-database"),
      getSecretFromKeyVault("db-user"),
      getSecretFromKeyVault("db-password"),
    ])

    return {
      server,
      database,
      user,
      password,
      port: 1433,
      options: {
        encrypt: true,
        trustServerCertificate: false,
        enableArithAbort: true,
        requestTimeout: 30000,
        connectionTimeout: 30000,
      },
    }
  } catch (error) {
    console.error("Error getting database configuration:", error)
    throw error
  }
}

export async function getConnection(): Promise<sql.ConnectionPool> {
  if (pool && pool.connected) {
    return pool
  }

  if (connectionLock) {
    // Wait for existing connection attempt
    while (connectionLock) {
      await new Promise((resolve) => setTimeout(resolve, 100))
    }
    if (pool && pool.connected) {
      return pool
    }
  }

  connectionLock = true

  try {
    console.log("Establishing new database connection...")

    const config = await getDatabaseConfig()

    // Create SOCKS connection
    const socket = await createSocksConnection()

    // Create connection pool with SOCKS socket
    pool = new sql.ConnectionPool({
      ...config,
      stream: socket,
    })

    await pool.connect()
    console.log("Database connection established successfully")

    return pool
  } catch (error) {
    console.error("Database connection failed:", error)
    pool = null
    throw error
  } finally {
    connectionLock = false
  }
}

export async function getDbConnection(): Promise<sql.ConnectionPool> {
  return getConnection()
}

export async function closeConnection(): Promise<void> {
  if (pool) {
    try {
      await pool.close()
      console.log("Database connection closed")
    } catch (error) {
      console.error("Error closing database connection:", error)
    } finally {
      pool = null
    }
  }
}

export async function query(queryText: string, params?: any[]): Promise<any> {
  try {
    const pool = await getConnection()
    const request = pool.request()

    if (params) {
      params.forEach((param, index) => {
        request.input(`param${index}`, param)
      })
    }

    const result = await request.query(queryText)
    return result.recordset
  } catch (error) {
    console.error("Database query failed:", error)
    throw error
  }
}

export async function testConnection(): Promise<boolean> {
  try {
    const pool = await getConnection()
    await pool.request().query("SELECT 1 as test")
    return true
  } catch (error) {
    console.error("Database connection test failed:", error)
    return false
  }
}

// Export sql for use in other modules
export { sql }
