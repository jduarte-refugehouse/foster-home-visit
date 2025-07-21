import { NextResponse } from "next/server"

export async function GET() {
  try {
    const envVars = {
      POSTGRES_USER: process.env.POSTGRES_USER ? "Configured" : "Not Configured",
      POSTGRES_PASSWORD: process.env.POSTGRES_PASSWORD ? "Configured" : "Not Configured",
      POSTGRES_DATABASE: process.env.POSTGRES_DATABASE ? "Configured" : "Not Configured",
      POSTGRES_HOST: process.env.POSTGRES_HOST ? "Configured" : "Not Configured",
      FIXIE_SOCKS_HOST: process.env.FIXIE_SOCKS_HOST ? "Configured" : "Not Configured",
      QUOTAGUARD_URL: process.env.QUOTAGUARD_URL ? "Configured" : "Not Configured",
      PROXY_URL: process.env.PROXY_URL ? "Configured" : "Not Configured",
    }

    const connectionDetails = {
      user: process.env.POSTGRES_USER || "v0_app_user",
      database: process.env.POSTGRES_DATABASE || "RadiusBifrost",
      server: process.env.POSTGRES_HOST || "refugehouse-bifrost-server.database.windows.net",
      port: 1433,
      usingFixie: !!process.env.FIXIE_SOCKS_HOST,
      usingQuotaGuard: !!process.env.QUOTAGUARD_URL || !!process.env.PROXY_URL,
    }

    return NextResponse.json({
      success: true,
      message: "Connection debug information fetched.",
      envVars,
      connectionDetails,
    })
  } catch (error: any) {
    console.error("API Connection Debug Error:", error)
    return NextResponse.json(
      { success: false, message: error.message || "An unknown error occurred during connection debug." },
      { status: 500 },
    )
  }
}
