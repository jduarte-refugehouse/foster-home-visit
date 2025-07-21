import { NextResponse } from "next/server"
import { testConnection, healthCheck } from "@/lib/db"

export async function GET() {
  try {
    const dbTestResult = await testConnection()
    const dbHealthResult = await healthCheck()

    const proxyHost = process.env.FIXIE_SOCKS_HOST
    const proxyUrl = process.env.QUOTAGUARD_URL // This should be removed if not used

    let proxyStatus = "No proxy configured."
    if (proxyHost) {
      proxyStatus = `Fixie SOCKS Host: Configured (first 10 chars): ${proxyHost.substring(0, 10)}...`
    } else if (proxyUrl) {
      proxyStatus = `QuotaGuard URL: Configured (first 10 chars): ${proxyUrl.substring(0, 10)}...`
    }

    return NextResponse.json({
      success: true,
      databaseConnection: dbTestResult,
      databaseHealth: dbHealthResult,
      proxyConfiguration: proxyStatus,
      environmentVariables: {
        FIXIE_SOCKS_HOST: process.env.FIXIE_SOCKS_HOST ? "Configured" : "Not Configured",
        QUOTAGUARD_URL: process.env.QUOTAGUARD_URL ? "Configured" : "Not Configured",
        POSTGRES_HOST: process.env.POSTGRES_HOST ? "Configured" : "Not Configured",
        POSTGRES_USER: process.env.POSTGRES_USER ? "Configured" : "Not Configured",
        POSTGRES_DATABASE: process.env.POSTGRES_DATABASE ? "Configured" : "Not Configured",
      },
    })
  } catch (error: any) {
    console.error("API Diagnostics Error:", error)
    return NextResponse.json(
      { success: false, message: error.message || "An unknown error occurred during diagnostics." },
      { status: 500 },
    )
  }
}
