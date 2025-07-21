import { NextResponse } from "next/server"
import { getConnection } from "@/lib/db"

export async function GET() {
  let dbConnectionStatus = "Not Tested"
  let dbConnectionError = ""
  let proxyConnectionStatus = "Not Tested"
  let proxyConnectionError = ""
  let proxyIp = "N/A"
  let currentClientIp = "N/A"

  // Test Database Connection
  try {
    const pool = await getConnection()
    const result = await pool.request().query("SELECT GETDATE() AS CurrentDateTime")
    dbConnectionStatus = `Success: ${result.recordset[0].CurrentDateTime.toISOString()}`
  } catch (error: any) {
    dbConnectionStatus = "Failed"
    dbConnectionError = error.message
  }

  // Test Proxy Connection
  try {
    const proxyResponse = await fetch(`${process.env.NEXT_PUBLIC_VERCEL_URL || "http://localhost:3000"}/api/proxy-test`)
    const proxyData = await proxyResponse.json()
    if (proxyData.success) {
      proxyConnectionStatus = `Success: Connected via ${proxyData.proxyIp}`
      proxyIp = proxyData.proxyIp
    } else {
      proxyConnectionStatus = "Failed"
      proxyConnectionError = proxyData.error || "Unknown proxy error"
    }
  } catch (error: any) {
    proxyConnectionStatus = "Failed"
    proxyConnectionError = error.message
  }

  // Get Current Client IP (as seen by Vercel/external)
  try {
    const ipResponse = await fetch(
      `${process.env.NEXT_PUBLIC_VERCEL_URL || "http://localhost:3000"}/api/add-current-ip`,
    )
    const ipData = await ipResponse.json()
    if (ipData.success) {
      currentClientIp = ipData.ipAddress
    } else {
      console.error("Failed to get current client IP:", ipData.error)
    }
  } catch (error) {
    console.error("Error fetching current client IP:", error)
  }

  return NextResponse.json({
    dbConnectionStatus,
    dbConnectionError,
    proxyConnectionStatus,
    proxyConnectionError,
    proxyIp,
    currentClientIp,
    fixieSocksHost: process.env.FIXIE_SOCKS_HOST ? "Configured" : "Not Configured",
    databaseUrl: process.env.DATABASE_URL ? "Configured" : "Not Configured",
    postgresUser: process.env.POSTGRES_USER ? "Configured" : "Not Configured",
    postgresHost: process.env.POSTGRES_HOST ? "Configured" : "Not Configured",
    postgresDatabase: process.env.POSTGRES_DATABASE ? "Configured" : "Not Configured",
  })
}
