import sql from "mssql"
import { SecretClient } from "@azure/keyvault-secrets"
import { ClientSecretCredential } from "@azure/identity"

let pool: sql.ConnectionPool | null = null

// ✨ STATIC IP CONNECTION ✨
// Using Vercel Static IPs (18.217.75.119, 18.116.232.18)
// These IPs are whitelisted in Azure SQL firewall
// No proxy needed - direct connection for better performance!

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
    console.error("❌ CRITICAL: No fallback password available. Key Vault must be configured correctly.")
    throw new Error(
      `Key Vault authentication failed: ${errorMessage}. Please check your Azure Key Vault configuration.`,
    )
  }
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
  // Get password from Azure Key Vault (no fallback - Key Vault is required)
  try {
    const passwordResult = await getPasswordFromKeyVault()
    lastPasswordSource = passwordResult.source
    lastPasswordError = passwordResult.error || ""
    // Database configuration with direct connection via Vercel Static IPs
    const config: sql.config = {
      user: "v0_app_user",
      password: passwordResult.password, // Retrieved securely from Key Vault
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
        requestTimeout: 120000, // 120 seconds for large queries
      },
    }
    
    console.log(`🔌 Attempting direct connection to ${config.server}...`)
    console.log(`🔑 Password source: ${lastPasswordSource}`)
    console.log(`✨ Using Vercel Static IPs - no proxy needed!`)
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
    lastPasswordSource = "Key Vault (Failed)"
    lastPasswordError = error instanceof Error ? error.message : "Unknown error"
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

export async function query<T = any>(queryText: string, params: any[] = [], timeout: number = 120000): Promise<T[]> {
  try {
    const connection = await getConnection()
    const request = connection.request()
    
    // Set request-specific timeout (default 120 seconds, configurable per query)
    request.timeout = timeout
    
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

export async function getDbConnection(): Promise<sql.ConnectionPool> {
  return getConnection()
}

// Export sql for use in other modules
export { sql }
