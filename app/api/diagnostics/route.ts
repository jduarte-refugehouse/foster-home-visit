import { type NextRequest, NextResponse } from "next/server"
import { headers } from "next/headers"
import { testConnection, getConnection } from "@/lib/db"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const headersList = await headers()
    const userAgent = headersList.get("user-agent") || "Unknown"

    console.log("🔍 Diagnostics endpoint called - performing real-time checks...")

    // Test database connection with actual query
    let isConnected = false
    let connectionDetails = null
    let dbError = null

    // Database connection configuration details
    const dbConfig = {
      user: "v0_app_user",
      database: "RadiusBifrost",
      server: "refugehouse-bifrost-server.database.windows.net",
      port: 1433,
      encrypt: true,
      trustServerCertificate: false,
      connectTimeout: 60000,
      requestTimeout: 60000,
    }

    // Key Vault configuration
    const keyVaultConfig = {
      configured: !!(
        process.env.AZURE_KEY_VAULT_NAME &&
        process.env.AZURE_CLIENT_ID &&
        process.env.AZURE_CLIENT_SECRET &&
        process.env.AZURE_TENANT_ID
      ),
      keyVaultName: process.env.AZURE_KEY_VAULT_NAME,
      keyVaultUrl: process.env.AZURE_KEY_VAULT_NAME
        ? `https://${process.env.AZURE_KEY_VAULT_NAME}.vault.azure.net/`
        : undefined,
      secretName: "database-password",
      tenantId: process.env.AZURE_TENANT_ID,
      clientId: process.env.AZURE_CLIENT_ID,
      error: undefined as string | undefined,
    }

    // Proxy configuration
    const proxyConfig = {
      configured: !!process.env.FIXIE_SOCKS_HOST,
      fixieHost: process.env.FIXIE_SOCKS_HOST,
      error: undefined as string | undefined,
    }

    try {
      console.log("🔌 Testing database connection...")
      console.log("📋 Using connection config:", {
        server: dbConfig.server,
        database: dbConfig.database,
        user: dbConfig.user,
        port: dbConfig.port,
      })

      const testResult = await testConnection()
      isConnected = testResult.success

      if (isConnected) {
        console.log("✅ Database connection successful, getting details...")
        const pool = await getConnection()
        const result = await pool.request().query(`
          SELECT 
            SUSER_SNAME() as login_name,
            DB_NAME() as database_name,
            @@VERSION as sql_version,
            GETDATE() as server_time
        `)
        connectionDetails = result.recordset[0]
        console.log("📊 Database details retrieved:", connectionDetails)
      } else {
        dbError = testResult.message
        console.error("❌ Database connection failed:", dbError)
      }
    } catch (error) {
      console.error("❌ Error during database diagnostics:", error)
      isConnected = false
      dbError = error instanceof Error ? error.message : "Unknown database error"
    }

    // Test Key Vault access
    if (keyVaultConfig.configured) {
      try {
        console.log("🔑 Testing Key Vault access...")
        console.log("🔑 Key Vault URL:", keyVaultConfig.keyVaultUrl)
        // We don't actually test the Key Vault here to avoid exposing secrets
        // The connection test above will reveal Key Vault issues
      } catch (error) {
        keyVaultConfig.error = error instanceof Error ? error.message : "Key Vault access error"
      }
    }

    const diagnostics = {
      timestamp: new Date().toISOString(),
      database: {
        connected: isConnected,
        connectionDetails: dbConfig,
        details: connectionDetails,
        error: dbError,
      },
      keyVault: keyVaultConfig,
      proxy: proxyConfig,
      environment: {
        nodeEnv: process.env.NODE_ENV || "unknown",
        hasKeyVault: keyVaultConfig.configured,
        hasFixieProxy: proxyConfig.configured,
        userAgent,
      },
      server: {
        platform: process.platform,
        nodeVersion: process.version,
      },
    }

    console.log("📋 Diagnostics completed:", {
      dbConnected: diagnostics.database.connected,
      keyVaultConfigured: diagnostics.keyVault.configured,
      proxyConfigured: diagnostics.proxy.configured,
    })

    return NextResponse.json(diagnostics)
  } catch (error) {
    console.error("❌ Diagnostics endpoint error:", error)
    return NextResponse.json(
      {
        error: "Diagnostics failed",
        message: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
        database: {
          connected: false,
          connectionDetails: {
            user: "v0_app_user",
            database: "RadiusBifrost",
            server: "refugehouse-bifrost-server.database.windows.net",
            port: 1433,
            encrypt: true,
            trustServerCertificate: false,
            connectTimeout: 60000,
            requestTimeout: 60000,
          },
          error: error instanceof Error ? error.message : "Unknown error",
        },
        keyVault: {
          configured: !!(
            process.env.AZURE_KEY_VAULT_NAME &&
            process.env.AZURE_CLIENT_ID &&
            process.env.AZURE_CLIENT_SECRET &&
            process.env.AZURE_TENANT_ID
          ),
          keyVaultName: process.env.AZURE_KEY_VAULT_NAME,
          keyVaultUrl: process.env.AZURE_KEY_VAULT_NAME
            ? `https://${process.env.AZURE_KEY_VAULT_NAME}.vault.azure.net/`
            : undefined,
          secretName: "database-password",
          tenantId: process.env.AZURE_TENANT_ID,
          clientId: process.env.AZURE_CLIENT_ID,
        },
        proxy: {
          configured: !!process.env.FIXIE_SOCKS_HOST,
          fixieHost: process.env.FIXIE_SOCKS_HOST,
        },
        environment: {
          nodeEnv: process.env.NODE_ENV || "unknown",
          hasKeyVault: !!(
            process.env.AZURE_KEY_VAULT_NAME &&
            process.env.AZURE_CLIENT_ID &&
            process.env.AZURE_CLIENT_SECRET &&
            process.env.AZURE_TENANT_ID
          ),
          hasFixieProxy: !!process.env.FIXIE_SOCKS_HOST,
          userAgent: "Unknown",
        },
        server: {
          platform: process.platform,
          nodeVersion: process.version,
        },
      },
      { status: 500 },
    )
  }
}
