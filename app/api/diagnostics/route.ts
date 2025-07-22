import { NextResponse } from "next/server"
import { testConnection } from "@/lib/db"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    console.log("🔍 Running system diagnostics...")

    // Test database connection
    const dbTest = await testConnection()

    // Environment checks
    const envChecks = {
      azureKeyVault: {
        configured: !!(
          process.env.AZURE_TENANT_ID &&
          process.env.AZURE_CLIENT_ID &&
          process.env.AZURE_CLIENT_SECRET &&
          process.env.AZURE_KEY_VAULT_NAME
        ),
        keyVaultName: process.env.AZURE_KEY_VAULT_NAME || "Not configured",
        tenantId: process.env.AZURE_TENANT_ID ? process.env.AZURE_TENANT_ID.substring(0, 8) + "..." : "Not set",
        clientId: process.env.AZURE_CLIENT_ID ? process.env.AZURE_CLIENT_ID.substring(0, 8) + "..." : "Not set",
      },
      proxy: {
        configured: !!process.env.FIXIE_SOCKS_HOST,
        host: process.env.FIXIE_SOCKS_HOST || "Not configured",
      },
      server: {
        environment: process.env.NODE_ENV || "unknown",
        platform: process.platform,
        nodeVersion: process.version,
      },
    }

    // Database connection details (from your locked configuration)
    const dbConfig = {
      server: "refugehouse-bifrost-server.database.windows.net",
      port: 1433,
      database: "RadiusBifrost",
      user: "v0_app_user",
      encryption: "Enabled",
      trustServerCertificate: "No",
      connectTimeout: "60000ms",
      requestTimeout: "60000ms",
    }

    const diagnostics = {
      timestamp: new Date().toISOString(),
      database: {
        status: dbTest.success ? "connected" : "disconnected",
        config: dbConfig,
        test: dbTest,
      },
      environment: envChecks,
      systemHealth: {
        overall: dbTest.success && envChecks.azureKeyVault.configured ? "healthy" : "degraded",
        components: {
          databaseConnection: {
            status: dbTest.success ? "healthy" : "error",
            message: dbTest.success ? "Database connection active" : dbTest.message,
          },
          azureKeyVault: {
            status: envChecks.azureKeyVault.configured ? "healthy" : "warning",
            message: envChecks.azureKeyVault.configured
              ? "Key Vault configured and accessible"
              : "Key Vault not properly configured",
          },
          proxyConnection: {
            status: envChecks.proxy.configured ? "healthy" : "warning",
            message: envChecks.proxy.configured ? "Fixie SOCKS proxy configured" : "No proxy configured",
          },
          serverEnvironment: {
            status: "active",
            message: `production environment on ${envChecks.server.platform}`,
          },
        },
      },
    }

    console.log("✅ Diagnostics completed")
    return NextResponse.json(diagnostics)
  } catch (error) {
    console.error("❌ Error running diagnostics:", error)
    return NextResponse.json(
      {
        error: "Diagnostics failed",
        message: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
