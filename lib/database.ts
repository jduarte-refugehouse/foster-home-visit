import { SecretClient } from "@azure/keyvault-secrets"
import { ClientSecretCredential } from "@azure/identity"
import sql from "mssql"

// Azure Key Vault client setup
let secretClient: SecretClient | null = null

function getSecretClient(): SecretClient {
  if (!secretClient) {
    // Create credential using environment variables
    const credential = new ClientSecretCredential(
      process.env.AZURE_TENANT_ID!,
      process.env.AZURE_CLIENT_ID!,
      process.env.AZURE_CLIENT_SECRET!,
    )

    // Create Key Vault client
    const vaultUrl = `https://${process.env.AZURE_KEY_VAULT_NAME}.vault.azure.net`
    secretClient = new SecretClient(vaultUrl, credential)
  }
  return secretClient
}

// Get connection string from Key Vault
async function getConnectionString(): Promise<string> {
  try {
    const client = getSecretClient()
    const secret = await client.getSecret("v0-db-connection-string")
    return secret.value || ""
  } catch (error) {
    console.error("Failed to get connection string from Key Vault:", error)
    // Fallback to environment variables if Key Vault fails
    return `Server=${process.env.AZURE_SQL_SERVER};Database=${process.env.AZURE_SQL_DATABASE};User Id=${process.env.AZURE_SQL_USERNAME};Password=${process.env.AZURE_SQL_PASSWORD};Encrypt=true;TrustServerCertificate=false;`
  }
}

// Database connection pool
let pool: sql.ConnectionPool | null = null

export async function getConnection(): Promise<sql.ConnectionPool> {
  if (!pool) {
    try {
      const connectionString = await getConnectionString()

      // Parse connection string or use direct config
      const config: sql.config = {
        connectionString,
        options: {
          encrypt: true,
          trustServerCertificate: false,
        },
        pool: {
          max: 10,
          min: 0,
          idleTimeoutMillis: 30000,
        },
      }

      pool = new sql.ConnectionPool(config)
      await pool.connect()
      console.log("Database connected successfully using Key Vault connection string")
    } catch (error) {
      console.error("Database connection failed:", error)
      throw error
    }
  }
  return pool
}

export async function executeQuery<T = any>(query: string, params?: any[]): Promise<T[]> {
  const connection = await getConnection()
  const request = connection.request()

  // Add parameters if provided
  if (params) {
    params.forEach((param, index) => {
      request.input(`param${index}`, param)
    })
  }

  const result = await request.query(query)
  return result.recordset
}

export async function executeScalar<T = any>(query: string, params?: any[]): Promise<T> {
  const connection = await getConnection()
  const request = connection.request()

  if (params) {
    params.forEach((param, index) => {
      request.input(`param${index}`, param)
    })
  }

  const result = await request.query(query)
  return result.recordset[0]
}

// Health check function
export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    const connection = await getConnection()
    const result = await connection.request().query("SELECT 1 as health")
    return result.recordset.length > 0
  } catch (error) {
    console.error("Database health check failed:", error)
    return false
  }
}

// Close connection pool (useful for cleanup)
export async function closeConnection(): Promise<void> {
  if (pool) {
    await pool.close()
    pool = null
  }
}
