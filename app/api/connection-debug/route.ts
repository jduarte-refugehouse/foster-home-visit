import { NextResponse } from "next/server"
import { testConnection } from "@/lib/db"
import Agent from "proxy-agent"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

async function getProxiedIp() {
  // This fetch needs to be proxied to give an accurate IP check.
  // We initialize a new proxy-agent instance here just for this check.
  // It will pick up the FIXIE_URL automatically.
  if (process.env.FIXIE_URL) {
    new Agent()
  }

  try {
    const response = await fetch("https://api.ipify.org?format=json")
    if (!response.ok) return "Error fetching IP"
    const data = await response.json()
    return data.ip
  } catch (error) {
    console.error("Failed to get outbound IP:", error)
    return "Unknown"
  }
}

export async function GET() {
  console.log("=== 🔍 Starting SOCKS proxy connection debug ===")

  const outboundIP = await getProxiedIp()
  console.log("✅ Outbound IP detected as:", outboundIP)

  const dbConnectionTest = await testConnection()

  // Updated with your new SOCKS proxy IPs from the screenshot
  const fixieIPs = ["3.224.144.155", "3.223.196.67"]
  const isUsingFixieIP = fixieIPs.includes(outboundIP)

  let analysis = ""
  if (dbConnectionTest.success && isUsingFixieIP) {
    analysis = "✅ Success! Connection is working correctly through the Fixie SOCKS proxy."
  } else if (dbConnectionTest.success && !isUsingFixieIP) {
    analysis =
      "⚠️ Warning: Connection works, but is NOT using a Fixie IP. This is unexpected. Check proxy configuration."
  } else if (!dbConnectionTest.success && isUsingFixieIP) {
    analysis =
      "❌ Error: Traffic is correctly routed through Fixie, but the database connection failed. Ensure your Fixie IPs are whitelisted in the Azure SQL firewall."
  } else {
    // !dbConnectionTest.success && !isUsingFixieIP
    analysis =
      "❌ Critical Error: The SOCKS proxy is not being used, and the database connection failed. Check the FIXIE_URL environment variable in Vercel."
  }

  return NextResponse.json({
    success: dbConnectionTest.success && isUsingFixieIP,
    timestamp: new Date().toISOString(),
    outboundIP,
    isUsingFixieIP,
    dbConnectionTest,
    analysis,
  })
}
