import { NextResponse } from "next/server"
import { testConnection } from "@refugehouse/shared-core/db"

import { NextRequest, NextResponse } from "next/server"
import { getClerkUserIdFromRequest } from "@refugehouse/shared-core/lib/clerk-auth-helper"
import { getConnection } from "@refugehouse/shared-core/lib/db"
import { testConnection } from "@refugehouse/shared-core/db"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    // SECURITY: Check if user is authenticated and found in database
    const { clerkUserId, email } = getClerkUserIdFromRequest(request)
    
    if (!clerkUserId && !email) {
      return NextResponse.json(
        { error: "Authentication required", message: "Please sign in to access diagnostics" },
        { status: 401 }
      )
    }

    // Check if user exists in database
    let userFound = false
    try {
      const connection = await getConnection()
      let userQuery = ""
      let queryParam = ""
      
      if (clerkUserId) {
        userQuery = "SELECT id FROM app_users WHERE clerk_user_id = @param0 AND is_active = 1"
        queryParam = clerkUserId
      } else if (email) {
        userQuery = "SELECT id FROM app_users WHERE email = @param0 AND is_active = 1"
        queryParam = email
      }
      
      if (queryParam) {
        const userResult = await connection.request().input("param0", queryParam).query(userQuery)
        userFound = userResult.recordset.length > 0
      }
    } catch (dbError) {
      console.error("Error checking user in database:", dbError)
    }

    if (!userFound) {
      return NextResponse.json(
        { 
          error: "Access denied", 
          message: "Your account is not registered in the system. Please contact an administrator." 
        },
        { status: 403 }
      )
    }

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
