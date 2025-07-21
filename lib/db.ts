import sql from "mssql"
import { SecretClient } from "@azure/keyvault-secrets"
import { DefaultAzureCredential } from "@azure/identity"

// ⚠️⚠️⚠️ CRITICAL WARNING ⚠️⚠️⚠️
// DO NOT CHANGE THE DATABASE CONNECTION PARAMETERS BELOW WITHOUT EXPLICIT USER PERMISSION
// THESE PARAMETERS ARE LOCKED AND WORKING
// CHANGING THEM WILL BREAK THE APPLICATION
// IF YOU CHANGE THESE, YOU WILL HAVE TO BREAK YOUR OWN FINGERS
// ⚠️⚠️⚠️ END WARNING ⚠️⚠️⚠️

let pool: sql.ConnectionPool | null = null

async function getPasswordFromKeyVault(): Promise<string> {
  try {
    console.log("🔐 Attempting to retrieve password from Azure Key Vault...")

    const keyVaultName = process.env.AZURE_KEY_VAULT_NAME
    if (!keyVaultName) {
      throw new Error("AZURE_KEY_VAULT_NAME environment variable is not set")
    }

    const keyVaultUrl = `https://${keyVaultName}.vault.azure.net/`
    const credential = new DefaultAzureCredential()
    const client = new SecretClient(keyVaultUrl, credential)

    const secret = await client.getSecret("database-password")

    if (!secret.value) {
      throw new Error("Password secret is empty or undefined")
    }

    console.log("✅ Successfully retrieved password from Azure Key Vault")
    return secret.value
  } catch (error: any) {
    console.error("❌ Failed to retrieve password from Key Vault:", error.message)
    throw new Error(`Key Vault authentication failed: ${error.message}`)
  }
}

export async function getConnection(): Promise<sql.ConnectionPool> {
  if (pool && pool.connected) {
    return pool
  }

  try {
    console.log("🔌 Establishing database connection...")

    const password = await getPasswordFromKeyVault()

    // ⚠️⚠️⚠️ THESE ARE THE CORRECT, WORKING, LOCKED DATABASE PARAMETERS ⚠️⚠️⚠️
    // DO NOT CHANGE THESE WITHOUT EXPLICIT USER PERMISSION
    // THESE PARAMETERS WORK AND ARE STABLE
    const config: sql.config = {
      user: "v0_app_user",
      password: password,
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
    }

    // Configure SOCKS proxy if available
    const fixieUrl = process.env.FIXIE_SOCKS_HOST
    if (fixieUrl) {
      console.log("🌐 Using Fixie SOCKS proxy for database connection")
      const [host, port] = fixieUrl.split(":")
      config.options = {
        ...config.options,
        // @ts-ignore - mssql types don't include proxy options but they work
        proxy: {
          host: host,
          port: Number.parseInt(port),
          type: 5, // SOCKS5
        },
      }
    }

    pool = new sql.ConnectionPool(config)
    await pool.connect()

    console.log("✅ Database connection established successfully")
    return pool
  } catch (error: any) {
    console.error("❌ Database connection failed:", error)
    throw error
  }
}

export async function query(queryString: string, params?: any[]): Promise<any[]> {
  try {
    const connection = await getConnection()
    const request = connection.request()

    if (params) {
      params.forEach((param, index) => {
        request.input(`param${index}`, param)
      })
    }

    const result = await request.query(queryString)
    return result.recordset
  } catch (error: any) {
    console.error("❌ Query execution failed:", error)
    throw error
  }
}

export async function closeConnection(): Promise<void> {
  if (pool) {
    await pool.close()
    pool = null
    console.log("🔌 Database connection closed")
  }
}
