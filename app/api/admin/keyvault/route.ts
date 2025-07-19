import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { KeyVaultService } from "@/lib/azure/keyvault-service"
import { appConfig } from "@/lib/config/app-config"

export async function GET() {
  try {
    const { userId } = auth()

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user has admin role (implement your own logic)
    // For now, we'll allow all authenticated users

    const keyVaultService = new KeyVaultService()
    const configStatus = await appConfig.getConfigStatus()

    // Get list of secrets (names only, not values)
    const secrets = await keyVaultService.listSecrets()

    return NextResponse.json({
      status: "success",
      keyVault: {
        connected: configStatus.keyVaultConnected,
        secretsCount: configStatus.secretsCount,
        secrets: secrets.map((name) => ({ name, hasValue: true })),
      },
      cache: {
        size: configStatus.cacheSize,
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Key Vault status check failed:", error)
    return NextResponse.json(
      {
        error: "Failed to check Key Vault status",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function POST(request: Request) {
  try {
    const { userId } = auth()

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { action } = body

    if (action === "clear-cache") {
      appConfig.clearCache()
      return NextResponse.json({ message: "Cache cleared successfully" })
    }

    if (action === "test-connection") {
      const keyVaultService = new KeyVaultService()
      const secrets = await keyVaultService.listSecrets()
      return NextResponse.json({
        message: "Connection successful",
        secretsFound: secrets.length,
      })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("Key Vault operation failed:", error)
    return NextResponse.json(
      {
        error: "Operation failed",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
