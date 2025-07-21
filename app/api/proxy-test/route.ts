import { NextResponse } from "next/server"

export async function GET() {
  try {
    const proxyHost = process.env.FIXIE_SOCKS_HOST
    const proxyUrl = process.env.QUOTAGUARD_URL // This should be removed if not used

    let message = "Proxy environment variables status:\n"

    if (proxyHost) {
      message += `Fixie SOCKS Host: Configured (first 10 chars): ${proxyHost.substring(0, 10)}...\n`
    } else {
      message += "Fixie SOCKS Host: NOT configured.\n"
    }

    if (proxyUrl) {
      message += `QuotaGuard URL: Configured (first 10 chars): ${proxyUrl.substring(0, 10)}...\n`
    } else {
      message += "QuotaGuard URL: NOT configured.\n"
    }

    return NextResponse.json({ success: true, message: message })
  } catch (error: any) {
    console.error("API Proxy Test Error:", error)
    return NextResponse.json(
      { success: false, message: error.message || "An unknown error occurred during proxy test." },
      { status: 500 },
    )
  }
}
