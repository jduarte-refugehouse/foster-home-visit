import { NextResponse } from "next/server"
import { getConnection } from "@/lib/db"
import { SecretClient } from "@azure/keyvault-secrets"
import { DefaultAzureCredential } from "@azure/identity"

export async function GET() {
  const diagnostics = {
    timestamp: new Date().toISOString(),
    overall: { status: "unknown", message: "" },
    proxy: {
      enabled: false,
      url: "",
      masked: "",
      clientIp: "",
    },
    database: {
      connected: false,
      error: "",
      clientIp: "",
    },
    keyVault: {
      configured: false,
      passwordSource: "unknown",
      error: "",
      config: {
        tenantId: "Not Set",
        clientId: "Not Set",
        clientSecret: "Not Set",
        keyVaultName: "Not Set",
      },
    },
  }

  try {
    // Check Key Vault configuration
    const keyVaultName = process.env.AZURE_KEY_VAULT_NAME
    const tenantId = process.env.AZURE_TENANT_ID
    const clientId = process.env.AZURE_CLIENT_ID
    const clientSecret = process.env.AZURE_CLIENT_SECRET

    diagnostics.keyVault.config = {
      tenantId: tenantId ? "Set" : "Not Set",
      clientId: clientId ? "Set" : "Not Set",
      clientSecret: clientSecret ? "Set" : "Not Set",
      keyVaultName: keyVaultName || "Not Set",
    }

    // Test Key Vault password retrieval
    try {
      if (keyVaultName && tenantId && clientId && clientSecret) {
        const keyVaultUrl = `https://${keyVaultName}.vault.azure.net/`
        const credential = new DefaultAzureCredential()
        const client = new SecretClient(keyVaultUrl, credential)

        const secret = await client.getSecret("database-password")

        if (secret.value) {
          diagnostics.keyVault.configured = true
          diagnostics.keyVault.passwordSource = "Azure Key Vault"
        } else {
          throw new Error("Password secret is empty")
        }
      } else {
        throw new Error("Key Vault environment variables not configured")
      }
    } catch (error: any) {
      diagnostics.keyVault.configured = false
      diagnostics.keyVault.passwordSource = "Failed"
      diagnostics.keyVault.error = error.message
    }

    // Check proxy configuration
    const fixieUrl = process.env.FIXIE_SOCKS_HOST
    if (fixieUrl) {
      diagnostics.proxy.enabled = true
      diagnostics.proxy.url = fixieUrl
      diagnostics.proxy.masked = fixieUrl.replace(/[^:@]*/, "++++++")
    }

    // Test database connection
    try {
      const pool = await getConnection()
      const result = await pool.request().query("SELECT @@VERSION as version, @@SERVERNAME as server")

      // Get client IP as seen by SQL Server
      const ipResult = await pool.request().query("SELECT CONNECTIONPROPERTY('client_net_address') as client_ip")
      const clientIp = ipResult.recordset[0]?.client_ip || "Unknown"

      diagnostics.database.connected = true
      diagnostics.database.clientIp = clientIp
      diagnostics.proxy.clientIp = clientIp

      // Check if IP matches Fixie range (rough check)
      if (fixieUrl && clientIp.startsWith("3.")) {
        diagnostics.overall.status = "success"
        diagnostics.overall.message =
          "Success! The database connection is correctly routed through the Fixie SOCKS proxy."
      } else if (fixieUrl) {
        diagnostics.overall.status = "warning"
        diagnostics.overall.message = "Database connected but may not be using the proxy correctly."
      } else {
        diagnostics.overall.status = "success"
        diagnostics.overall.message = "Database connected successfully (no proxy configured)."
      }
    } catch (error: any) {
      diagnostics.database.connected = false
      diagnostics.database.error = error.message
      diagnostics.overall.status = "error"
      diagnostics.overall.message = `Database connection failed: ${error.message}`
    }

    return NextResponse.json(diagnostics)
  } catch (error: any) {
    diagnostics.overall.status = "error"
    diagnostics.overall.message = `Diagnostic failed: ${error.message}`
    return NextResponse.json(diagnostics, { status: 500 })
  }
}
