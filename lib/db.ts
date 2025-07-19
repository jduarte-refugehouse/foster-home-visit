import { SecretClient } from "@azure/keyvault-secrets"
import { ClientSecretCredential } from "@azure/identity"
import sql from "mssql"

let pool: sql.ConnectionPool | null = null

async function getConnectionString(): Promise<string> {
  try {
    const credential = new ClientSecretCredential(
      process.env.AZURE_TENANT_ID!,
      process.env.AZURE_CLIENT_ID!,
      process.env.AZURE_CLIENT_SECRET!,
    )

    const vaultUrl = `https://${process.env.AZURE_KEY_VAULT_NAME}.vault.azure.net`
    const client = new SecretClient(vaultUrl, credential)

    console.log("Retrieving connection string from Key Vault...")
    const secret = await client.getSecret("v0-db-connection-string")
    console.log("Connection string retrieved successfully")

    return secret.value || ""
  } catch (error) {
    console.error("Failed to get connection string from Key Vault:", error)
    throw error
  }
}

// Properly parse the connection string
function parseConnectionString(connectionString: string): sql.config {
  console.log("Parsing connection string...")

  // Parse the connection string key-value pairs
  const params: Record<string, string> = {}
  connectionString.split(";").forEach((pair) => {
    const [key, value] = pair.split("=")
    if (key && value) {
      params[key.trim()] = value.trim()
    }
  })

  console.log("Connection string parameters parsed:")
  console.log("- Server:", params["Server"])
  console.log("- Database:", params["Initial Catalog"])
  console.log("- User:", params["User ID"])
  console.log("- Encrypt:", params["Encrypt"])
  console.log("- Trust Server Certificate:", params["TrustServerCertificate"])

  // Map to mssql config format
  const config: sql.config = {
    user: params["User ID"],
    password: params["Password"],
    database: params["Initial Catalog"],
    server: params["Server"].replace("tcp:", "").replace(",1433", ""),
    pool: {
      max: 10,
      min: 0,
      idleTimeoutMillis: 30000,
    },
    options: {
      encrypt: params["Encrypt"] === "True",
      trustServerCertificate: params["TrustServerCertificate"] === "True",
      enableArithAbort: true,
      connectionTimeout: Number.parseInt(params["Connection Timeout"]) * 1000 || 30000,
      requestTimeout: 30000,
    },
  }

  console.log("Final config:")
  console.log("- Server:", config.server)
  console.log("- Database:", config.database)
  console.log("- User:", config.user)
  console.log("- Encrypt:", config.options?.encrypt)
  console.log("- Connection Timeout:", config.options?.connectionTimeout)

  return config
}

export async function getConnection(): Promise<sql.ConnectionPool> {
  // If pool exists but is closed, reset it
  if (pool && !pool.connected) {
    console.log("Pool exists but is not connected, resetting...")
    pool = null
  }

  if (!pool) {
    try {
      console.log("=== Establishing new database connection ===")
      const connectionString = await getConnectionString()
      const config = parseConnectionString(connectionString)

      console.log("Attempting connection to:", config.server)
      console.log("Database:", config.database)
      console.log("User:", config.user)

      pool = new sql.ConnectionPool(config)

      // Add event listeners for better debugging
      pool.on("connect", () => {
        console.log("✅ Database pool connected successfully")
      })

      pool.on("error", (err) => {
        console.error("❌ Database pool error:", err)
        pool = null // Reset pool on error
      })

      pool.on("close", () => {
        console.log("🔒 Database pool connection closed")
        pool = null
      })

      await pool.connect()
      console.log("✅ Database connected successfully")
    } catch (err) {
      console.error("❌ Database connection failed:", err)
      pool = null // Reset pool on failure
      throw err
    }
  }

  return pool
}

export async function query(queryText: string, params: any[] = []): Promise<any[]> {
  let retries = 3
  let lastError: Error | null = null

  while (retries > 0) {
    try {
      console.log(`🔍 Executing query (attempt ${4 - retries}/3):`, queryText.substring(0, 100) + "...")

      const connection = await getConnection()

      // Check if connection is still valid
      if (!connection.connected) {
        console.log("⚠️ Connection not active, reconnecting...")
        pool = null
        throw new Error("Connection not active")
      }

      const request = connection.request()

      // Add parameters if provided
      params.forEach((param, index) => {
        request.input(`param${index}`, param)
      })

      const result = await request.query(queryText)
      console.log("✅ Query executed successfully, returned", result.recordset.length, "rows")

      return result.recordset
    } catch (error) {
      lastError = error as Error
      console.error(`❌ Query attempt failed (${4 - retries}/3):`, error)

      // Reset pool on connection errors
      if (
        error instanceof Error &&
        (error.message.includes("Connection is closed") ||
          error.message.includes("Connection not active") ||
          error.message.includes("socket hang up"))
      ) {
        console.log("🔄 Connection error detected, resetting pool...")
        pool = null
      }

      retries--
      if (retries > 0) {
        console.log(`⏳ Retrying in 2 seconds... (${retries} attempts remaining)`)
        await new Promise((resolve) => setTimeout(resolve, 2000))
      }
    }
  }

  throw lastError || new Error("Query failed after all retries")
}

// Test database connection with retry logic
export async function testConnection(): Promise<{ success: boolean; message: string; data?: any[] }> {
  try {
    console.log("🧪 Starting connection test...")
    const result = await query(`
      SELECT 
        1 as test, 
        GETDATE() as current_time, 
        DB_NAME() as database_name,
        USER_NAME() as current_user,
        @@SERVERNAME as server_name
    `)

    console.log("✅ Connection test successful")
    return {
      success: true,
      message: "Database connection successful",
      data: result,
    }
  } catch (error) {
    console.error("❌ Database connection test failed:", error)
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

// Close connection pool gracefully
export async function closeConnection(): Promise<void> {
  if (pool) {
    try {
      console.log("🔒 Closing database connection pool...")
      await pool.close()
      console.log("✅ Database connection pool closed successfully")
    } catch (error) {
      console.error("❌ Error closing database connection pool:", error)
    } finally {
      pool = null
    }
  }
}

// Health check function
export async function healthCheck(): Promise<boolean> {
  try {
    console.log("🏥 Running health check...")
    const result = await testConnection()
    console.log("🏥 Health check result:", result.success ? "✅ Healthy" : "❌ Unhealthy")
    return result.success
  } catch (error) {
    console.error("❌ Health check failed:", error)
    return false
  }
}

// Get connection info for debugging
export async function getConnectionInfo(): Promise<any> {
  try {
    const connectionString = await getConnectionString()
    const config = parseConnectionString(connectionString)

    return {
      server: config.server,
      database: config.database,
      user: config.user,
      encrypt: config.options?.encrypt,
      trustServerCertificate: config.options?.trustServerCertificate,
      connectionTimeout: config.options?.connectionTimeout,
      poolConnected: pool?.connected || false,
      poolExists: !!pool,
    }
  } catch (error) {
    console.error("Failed to get connection info:", error)
    return { error: error instanceof Error ? error.message : "Unknown error" }
  }
}
