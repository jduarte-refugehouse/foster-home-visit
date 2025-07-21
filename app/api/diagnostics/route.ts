import { NextResponse } from "next/server"
import { testConnection } from "@/lib/db"

export async function GET() {
  try {
    const result = await testConnection()

    // Check environment variables for Key Vault
    const keyVaultConfig = {
      tenantId: process.env.AZURE_TENANT_ID ? "Set" : "Missing",
      clientId: process.env.AZURE_CLIENT_ID ? "Set" : "Missing",
      clientSecret: process.env.AZURE_CLIENT_SECRET ? "Set" : "Missing",
      keyVaultName: process.env.AZURE_KEY_VAULT_NAME || "Missing",
    }

    // Check proxy configuration
    const proxyConfig = {
      usingProxy: !!process.env.FIXIE_SOCKS_HOST,
      fixieUrl: process.env.FIXIE_SOCKS_HOST
        ? process.env.FIXIE_SOCKS_HOST.replace(/:[^:@]*@/, ":*******@")
        : "Not configured",
    }

    return NextResponse.json({
      success: result.success,
      message: result.message,
      data: result.data,
      passwordSource: result.passwordSource,
      passwordError: result.passwordError,
      keyVaultConfig,
      proxyConfig,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error occurred",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
