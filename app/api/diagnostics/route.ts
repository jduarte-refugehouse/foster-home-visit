import { NextResponse } from "next/server"
import { testConnection } from "@refugehouse/shared-core/db"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    console.log("🔍 [Diagnostics] Running system diagnostics...")

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
        keyVaultUrl: process.env.AZURE_KEY_VAULT_NAME
          ? `https://${process.env.AZURE_KEY_VAULT_NAME}.vault.azure.net/`
          : "Not configured",
        tenantId: process.env.AZURE_TENANT_ID || "Not configured",
        clientId: process.env.AZURE_CLIENT_ID || "Not configured",
        secretName: "database-password",
      },
      connection: {
        type: "Direct via Vercel Static IPs",
        staticIPs: ["18.217.75.119", "18.116.232.18"],
        whitelisted: "Azure SQL Firewall",
      },
      database: {
        server: "refugehouse-bifrost-server.database.windows.net",
        database: "RadiusBifrost",
        user: "v0_app_user",
        port: 1433,
        encryption: "Enabled",
        trustServerCertificate: "No",
        connectTimeout: "60000ms",
        requestTimeout: "60000ms",
      },
    }

    const diagnostics = {
      timestamp: new Date().toISOString(),
      database: {
        status: dbTest.success ? "connected" : "disconnected",
        message: dbTest.message,
        data: dbTest.data,
        passwordSource: dbTest.passwordSource,
        passwordError: dbTest.passwordError,
      },
      environment: envChecks,
      system: {
        nodeVersion: process.version,
        platform: process.platform,
        environment: process.env.NODE_ENV || "development",
      },
      components: {
        databaseConnection: {
          status: dbTest.success ? "healthy" : "error",
          message: dbTest.success ? "Database connection active" : "Database connection failed",
          details: dbTest.success ? dbTest.data : dbTest.message,
        },
        azureKeyVault: {
          status: envChecks.azureKeyVault.configured ? "healthy" : "warning",
          message: envChecks.azureKeyVault.configured
            ? "Key Vault configured and accessible"
            : "Key Vault not properly configured",
        },
        serverEnvironment: {
          status: "active",
          message: `production environment on ${process.platform}`,
        },
      },
    }

    console.log("✅ [Diagnostics] System diagnostics completed")

    return NextResponse.json(diagnostics)
  } catch (error) {
    console.error("❌ [Diagnostics] Error running diagnostics:", error)

    return NextResponse.json(
      {
        timestamp: new Date().toISOString(),
        error: "Failed to run diagnostics",
        message: error instanceof Error ? error.message : "Unknown error",
        database: {
          status: "error",
          message: "Failed to test database connection",
        },
      },
      { status: 500 },
    )
  }
}
