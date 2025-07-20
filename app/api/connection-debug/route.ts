import { NextResponse } from "next/server"
import { testConnection } from "@/lib/db"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET() {
  console.log("=== 🔍 Starting SOCKS proxy database connection test ===")

  const dbConnectionTest = await testConnection()

  let analysis = ""
  if (dbConnectionTest.success) {
    analysis = "✅ Success! The database connection through the Fixie SOCKS proxy is working correctly."
  } else {
    analysis =
      "❌ Connection Failed. This indicates a problem with the SOCKS proxy configuration or the Azure SQL firewall rules. Please verify your FIXIE_URL and that your Fixie IPs are whitelisted."
  }

  return NextResponse.json({
    success: dbConnectionTest.success,
    timestamp: new Date().toISOString(),
    dbConnectionTest,
    analysis,
  })
}
