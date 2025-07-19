import { NextResponse } from "next/server"
import { SecretClient } from "@azure/keyvault-secrets"
import { ClientSecretCredential } from "@azure/identity"
import sql from "mssql"
import { getConnectionInfo } from "@/lib/db"

// Force Node.js runtime (not Edge)
export const runtime = "nodejs"

export async function GET() {
  try {
    console.log("=== 🔍 Starting comprehensive connection debug ===")

    // Get current IP
    let currentIP = "Unknown"
    try {
      const ipResponse = await fetch("https://api.ipify.org?format=json")
      const ipData = await ipResponse.json()
      currentIP = ipData.ip
      console.log("🌐 Current Vercel function IP:", currentIP)
    } catch (error) {
      console.error("Failed to get current IP:", error)
    }

    // Get connection configuration info
    const connectionInfo = getConnectionInfo()
    console.log("🔧 Connection info:", connectionInfo)

    // Test Key Vault access
    console.log("🔑 Testing Key Vault access...")
    const keyVaultTest = { success: false, error: "" }
    try {
      const credential = new ClientSecretCredential(
        process.env.AZURE_TENANT_ID!,
        process.env.AZURE_CLIENT_ID!,
        process.env.AZURE_CLIENT_SECRET!,
      )

      const vaultUrl = `https://${process.env.AZURE_KEY_VAULT_NAME}.vault.azure.net`
      const client = new SecretClient(vaultUrl, credential)

      const secret = await client.getSecret("v0-db-connection-string")
      keyVaultTest.success = !!secret.value
      console.log("✅ Key Vault access successful")
    } catch (error) {
      keyVaultTest.error = error instanceof Error ? error.message : "Unknown Key Vault error"
      console.error("❌ Key Vault access failed:", error)
    }

    // Test direct database connection with detailed error info
    console.log("🗄️ Testing direct database connection...")
    const dbConnectionTest = { success: false, error: "", details: "" }

    try {
      const config: sql.config = {
        user: "v0_app_user",
        password: "M7w!vZ4#t8LcQb1R",
        database: "RadiusBifrost",
        server: "refugehouse-bifrost-server.database.windows.net",
        pool: {
          max: 1, // Use minimal pool for testing
          min: 0,
          idleTimeoutMillis: 10000,
        },
        options: {
          encrypt: true,
          trustServerCertificate: false,
          enableArithAbort: true,
          connectTimeout: 15000, // 15 second timeout
          requestTimeout: 15000,
        },
      }

      console.log("Attempting connection to:", config.server)
      console.log("Database:", config.database)
      console.log("User:", config.user)

      const pool = new sql.ConnectionPool(config)
      await pool.connect()

      console.log("✅ Database connection successful")

      // Try a simple query
      const result = await pool.request().query("SELECT 1 as test, GETDATE() as current_time")
      console.log("✅ Query successful")

      await pool.close()

      dbConnectionTest.success = true
      dbConnectionTest.details = `Connected successfully, query returned ${result.recordset.length} rows`
    } catch (error) {
      dbConnectionTest.error = error instanceof Error ? error.message : "Unknown database error"
      dbConnectionTest.details = error instanceof Error ? error.stack || "" : ""
      console.error("❌ Database connection failed:", error)
    }

    // Analyze the error for common issues
    let errorAnalysis = ""
    if (!dbConnectionTest.success) {
      const errorMsg = dbConnectionTest.error.toLowerCase()
      if (errorMsg.includes("timeout") || errorMsg.includes("connection timeout")) {
        errorAnalysis = "Connection timeout - likely IP address not whitelisted in Azure SQL firewall"
      } else if (errorMsg.includes("login failed") || errorMsg.includes("authentication")) {
        errorAnalysis = "Authentication failed - check username/password"
      } else if (errorMsg.includes("server was not found") || errorMsg.includes("network")) {
        errorAnalysis = "Network/DNS issue - check server name"
      } else if (errorMsg.includes("firewall") || errorMsg.includes("blocked")) {
        errorAnalysis = "Firewall blocking connection - IP address not whitelisted"
      } else if (errorMsg.includes("dns.lookup") || errorMsg.includes("unenv")) {
        errorAnalysis = "Runtime environment issue - using Node.js runtime now"
      } else {
        errorAnalysis = "Unknown connection error - check Azure SQL configuration"
      }
    }

    // Check if Fixie IPs are expected (you'll need to update these with your actual Fixie IPs)
    const fixieIPs = ["52.87.187.138", "52.87.187.139"] // Example - replace with actual Fixie IPs
    const isUsingFixieIP = fixieIPs.includes(currentIP)

    return NextResponse.json({
      success: dbConnectionTest.success,
      timestamp: new Date().toISOString(),
      currentIP,
      vercelRegion: process.env.VERCEL_REGION || "Unknown",
      runtime: "nodejs", // Confirm we're using Node.js runtime
      connectionInfo,
      keyVaultTest,
      dbConnectionTest,
      errorAnalysis,
      proxyAnalysis: {
        expectedFixieIPs: fixieIPs,
        currentIPIsFixie: isUsingFixieIP,
        proxyConfigured: connectionInfo.proxyConfigured,
        proxyAgentSet: connectionInfo.usingProxyAgent,
        httpProxySet: connectionInfo.usingHttpProxy,
        message: isUsingFixieIP
          ? "✅ Using Fixie IP - proxy is working!"
          : "❌ Not using Fixie IP - proxy may not be configured correctly",
      },
      recommendations: dbConnectionTest.success
        ? ["Connection is working properly"]
        : [
            !connectionInfo.proxyConfigured
              ? "❌ FIXIE_URL environment variable not set"
              : "✅ FIXIE_URL environment variable is set",
            !isUsingFixieIP ? `❌ Current IP (${currentIP}) is not a Fixie IP` : "✅ Using Fixie static IP",
            "Check Azure SQL firewall rules",
            "Verify Fixie proxy configuration",
            "Add Fixie IPs to Azure SQL firewall: " + fixieIPs.join(", "),
            "Ensure using Node.js runtime (not Edge)",
          ],
    })
  } catch (error) {
    console.error("=== ❌ Connection debug failed ===", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
        runtime: "nodejs",
      },
      { status: 500 },
    )
  }
}
