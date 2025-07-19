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

    const secret = await client.getSecret("v0-db-connection-string")
    return secret.value || ""
  } catch (error) {
    console.error("Failed to get connection string from Key Vault:", error)
    throw error
  }
}

function getConfig(): sql.config {
  const baseConfig: sql.config = {
    user: "v0_app_user",
    password: "M7w!vZ4#t8LcQb1R",
    database: "RadiusBifrost",
    server: "refugehouse-bifrost-server.database.windows.net",
    pool: {
      max: 10,
      min: 0,
      idleTimeoutMillis: 30000,
    },
    options: {
      encrypt: true,
      trustServerCertificate: false,
      enableArithAbort: true,
      connectTimeout: 30000,
      requestTimeout: 30000,
    },
  }

  const proxyUrl = process.env.FIXIE_URL || process.env.QUOTAGUARD_URL || process.env.PROXY_URL
  if (proxyUrl) {
    console.log("🔗 Proxy URL detected. Setting process-level proxy environment variables.")
    // This is a best-effort attempt for libraries that respect these variables.
    process.env.HTTP_PROXY = proxyUrl
    process.env.HTTPS_PROXY = proxyUrl
  } else {
    console.log("⚠️ No proxy configured - using direct connection.")
  }

  return baseConfig
}

export async function getConnection(): Promise<sql.ConnectionPool> {
  if (pool && !pool.connected) {
    console.log("Pool exists but is not connected, resetting...")
    await pool.close().catch((err) => console.error("Error closing stale pool:", err))
    pool = null
  }

  if (!pool) {
    try {
      const config = getConfig()
      console.log("🔌 Attempting database connection to:", config.server)
      pool = new sql.ConnectionPool(config)
      pool.on("error", (err) => {
        console.error("❌ Database pool error:", err)
        pool = null
      })
      await pool.connect()
      console.log("✅ Database connected successfully")
    } catch (err) {
      console.error("❌ Database connection failed:", err)
      pool = null
      throw err
    }
  }
  return pool
}

export async function query(queryText: string, params: any[] = []): Promise<any[]> {
  try {
    const connection = await getConnection()
    const request = connection.request()
    params.forEach((param, index) => request.input(`param${index}`, param))
    const result = await request.query(queryText)
    return result.recordset
  } catch (error) {
    console.error(`❌ Query failed:`, error)
    if (pool) {
      await pool.close().catch((err) => console.error("Error closing pool after query failure:", err))
      pool = null
    }
    throw error
  }
}

export async function testConnection(): Promise<{ success: boolean; message: string; data?: any[] }> {
  try {
    const result = await query("SELECT 1 as test, GETDATE() as current_time")
    return { success: true, message: "Database connection successful", data: result }
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : "Unknown error" }
  }
}

export async function healthCheck(): Promise<boolean> {
  return (await testConnection()).success
}

export async function forceReconnect(): Promise<void> {
  if (pool) {
    await pool.close()
    pool = null
  }
}

export function getConnectionInfo(): any {
  const config = getConfig()
  const proxyUrl = process.env.FIXIE_URL || process.env.QUOTAGUARD_URL || process.env.PROXY_URL
  return {
    server: config.server,
    database: config.database,
    proxyConfigured: !!proxyUrl,
    poolConnected: pool?.connected || false,
  }
}
