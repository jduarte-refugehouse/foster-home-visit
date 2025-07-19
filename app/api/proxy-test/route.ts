import { NextResponse } from "next/server"

export async function GET() {
  try {
    console.log("=== 🔍 Testing proxy configuration ===")

    // Check environment variables
    const quotaguardUrl = process.env.QUOTAGUARD_URL
    const proxyUrl = process.env.PROXY_URL

    console.log("Environment variables:")
    console.log("QUOTAGUARD_URL exists:", !!quotaguardUrl)
    console.log("PROXY_URL exists:", !!proxyUrl)

    if (quotaguardUrl) {
      console.log("QUOTAGUARD_URL (masked):", quotaguardUrl.replace(/\/\/.*@/, "//***:***@"))
    }

    // Test the proxy by making a request through it
    let proxyTestResult = null
    if (quotaguardUrl || proxyUrl) {
      try {
        const testUrl = quotaguardUrl || proxyUrl
        console.log("Testing proxy connection...")

        // Use fetch with proxy (this might not work in Vercel, but let's try)
        const response = await fetch("https://api.ipify.org?format=json", {
          // Note: fetch doesn't support proxy directly, this is just for testing
        })

        const ipData = await response.json()
        proxyTestResult = {
          success: true,
          currentIP: ipData.ip,
          message: "IP check successful (but may not be through proxy)",
        }
      } catch (error) {
        proxyTestResult = {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        }
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      environmentVariables: {
        QUOTAGUARD_URL: !!quotaguardUrl,
        PROXY_URL: !!proxyUrl,
        quotaguardUrlMasked: quotaguardUrl ? quotaguardUrl.replace(/\/\/.*@/, "//***:***@") : null,
      },
      proxyTestResult,
      message: "Proxy configuration check completed",
    })
  } catch (error) {
    console.error("Proxy test failed:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
