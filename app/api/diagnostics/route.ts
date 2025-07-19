import { NextResponse } from "next/server"

// Force Node.js runtime (not Edge)
export const runtime = "nodejs"

export async function GET() {
  try {
    console.log("=== 🔍 Running connection diagnostics ===")

    // Get our current IP address
    let currentIP = "Unknown"
    try {
      const ipResponse = await fetch("https://api.ipify.org?format=json")
      const ipData = await ipResponse.json()
      currentIP = ipData.ip
      console.log("Current Vercel function IP:", currentIP)
    } catch (error) {
      console.error("Failed to get current IP:", error)
    }

    // Get Vercel deployment info
    const deploymentInfo = {
      region: process.env.VERCEL_REGION || "Unknown",
      url: process.env.VERCEL_URL || "Unknown",
      environment: process.env.VERCEL_ENV || "Unknown",
      runtime: "nodejs",
    }

    // Check environment variables
    const envCheck = {
      hasAzureTenantId: !!process.env.AZURE_TENANT_ID,
      hasAzureClientId: !!process.env.AZURE_CLIENT_ID,
      hasAzureClientSecret: !!process.env.AZURE_CLIENT_SECRET,
      hasKeyVaultName: !!process.env.AZURE_KEY_VAULT_NAME,
      hasFixieUrl: !!process.env.FIXIE_URL,
      hasQuotaguardUrl: !!process.env.QUOTAGUARD_URL,
      hasProxyUrl: !!process.env.PROXY_URL,
    }

    console.log("Deployment info:", deploymentInfo)
    console.log("Environment variables check:", envCheck)

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      currentIP,
      deploymentInfo,
      envCheck,
      message: "Diagnostics completed successfully",
    })
  } catch (error) {
    console.error("Diagnostics failed:", error)
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
