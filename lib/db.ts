import { SecretClient } from "@azure/keyvault-secrets"
import { ClientSecretCredential } from "@azure/identity"
import sql from "mssql"

let pool: sql.ConnectionPool | null = null

async function getConnectionString(): Promise<string> {
  try {
    // Create Azure credential
    const credential = new ClientSecretCredential(
      process.env.AZURE_TENANT_ID!,
      process.env.AZURE_CLIENT_ID!,
      process.env.AZURE_CLIENT_SECRET!,
    )

    // Connect to Key Vault
    const vaultUrl = `https://${process.env.AZURE_KEY_VAULT_NAME}.vault.azure.net`
    const client = new SecretClient(vaultUrl, credential)

    // Get the connection string
    const secret = await client.getSecret("v0-db-connection-string")
    return secret.value || ""
  } catch (error) {
    console.error("Failed to get connection string from Key Vault:", error)
    throw error
  }
}

export async function getConnection(): Promise<sql.ConnectionPool> {
  if (!pool) {
    try {
      const connectionString = await getConnectionString()
      console.log("Connecting to database with connection string from Key Vault...")

      pool = new sql.ConnectionPool(connectionString)
      await pool.connect()

      console.log("Database connected successfully")
    } catch (err) {
      console.error("Database connection failed:", err)
      throw err
    }
  }
  return pool
}

export async function query(queryText: string, params: any[] = []): Promise<any[]> {
  const connection = await getConnection()
  const request = connection.request()

  // Add parameters if provided
  params.forEach((param, index) => {
    request.input(`param${index}`, param)
  })

  const result = await request.query(queryText)
  return result.recordset
}

// Test database connection
export async function testConnection(): Promise<{ success: boolean; message: string; data?: any[] }> {
  try {
    const connection = await getConnection()
    const result = await connection
      .request()
      .query("SELECT 1 as test, GETDATE() as current_time, DB_NAME() as database_name")
    return {
      success: true,
      message: "Database connection successful",
      data: result.recordset,
    }
  } catch (error) {
    console.error("Database connection test failed:", error)
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

// Close connection pool
export async function closeConnection(): Promise<void> {
  if (pool) {
    await pool.close()
    pool = null
  }
}
