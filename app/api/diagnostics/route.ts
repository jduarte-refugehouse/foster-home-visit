import { NextResponse } from "next/server"
import { testConnection } from "@/lib/db"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET() {
  console.log("=== 🔍 Running connection diagnostics ===")

  const fixieUrl = process.env.FIXIE_SOCKS_HOST || "Not Set"
  const fixieStaticIPs = ["3.224.144.155", "3.223.196.67"] // Your known Fixie IPs

  const dbConnectionTest = await testConnection()

  let analysis = ""
  let clientIP = ""
  if (dbConnectionTest.data && dbConnectionTest.data.length > 0) {
    clientIP = dbConnectionTest.data[0].client_ip
  }

  if (dbConnectionTest.success && clientIP) {
    if (fixieStaticIPs.includes(clientIP)) {
      analysis = "✅ Success! The database connection is correctly routed through the Fixie SOCKS proxy."
    } else {
      analysis = `⚠️ Connection successful, but from an unexpected IP (${clientIP}). The connection is NOT using the Fixie proxy.`
      dbConnectionTest.success = false // Mark as failure for UI purposes
    }
  } else {
    analysis =
      "❌ Connection Failed. This could be due to incorrect proxy credentials in FIXIE_SOCKS_HOST, or the Fixie static IPs not being whitelisted in your Azure SQL firewall."
  }

  return NextResponse.json({
    success: dbConnectionTest.success,
    timestamp: new Date().toISOString(),
    usingProxy: !!process.env.FIXIE_SOCKS_HOST,
    fixieUrlMasked: fixieUrl.replace(/:([^:@]+)@/, ":********@"),
    dbConnectionTest,
    analysis,
  })
}
