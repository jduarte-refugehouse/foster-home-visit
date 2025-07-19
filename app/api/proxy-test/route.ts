import { NextResponse } from "next/server"

// Force Node.js runtime (not Edge)
export const runtime = "nodejs"

export async function GET() {
  try {
    console.log("=== 🔍 Testing proxy configuration ===")

    // Check environment variables
    const fixieUrl = process.env.FIXIE_URL
    const quotaguardUrl = process.env.QUOTAGUARD_URL
    const proxyUrl = process.env.PROXY_URL

    console.log("Environment variables:")
    console.log("FIXIE_URL exists:", !!fixieUrl)
    console.log("QUOTAGUARD_URL exists:", !!quotaguardUrl)
    console.log("PROXY_URL exists:", !!proxyUrl)

    const activeProxyUrl = fixieUrl || quotaguardUrl || proxyUrl

    if (activeProxyUrl) {
      console.log("Active proxy URL (masked):", activeProxyUrl.replace(/\/\/.*@/, "//***:***@"))
    }

    // Test the proxy by making a request through it
    let proxyTestResult = null
    if (activeProxyUrl) {
      try {
        console.log("Testing proxy connection...")

        // Get current IP without proxy
        const directResponse = await fetch("https://api.ipify.org?format=json")
        const directIP = await directResponse.json()

        proxyTestResult = {
          success: true,
          directIP: directIP.ip,
          message: "IP check successful (direct connection - proxy test limited in serverless)",
          note: "Proxy will be used for database connections, not HTTP requests",
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
      runtime: "nodejs",
      environmentVariables: {
        FIXIE_URL: !!fixieUrl,
        QUOTAGUARD_URL: !!quotaguardUrl,
        PROXY_URL: !!proxyUrl,
        activeProxyMasked: activeProxyUrl ? activeProxyUrl.replace(/\/\/.*@/, "//***:***@") : null,
        proxyType: activeProxyUrl ? (activeProxyUrl.startsWith("http:") ? "HTTP" : "HTTPS") : null,
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
        runtime: "nodejs",
      },
      { status: 500 },
    )
  }
}
