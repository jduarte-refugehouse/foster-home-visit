import { NextResponse } from "next/server"
import { getConnection } from "@/lib/db"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function GET() {
  console.log("📊 Fetching database information...")

  const debugInfo = {
    timestamp: new Date().toISOString(),
    connection: {
      status: "unknown",
      server: "",
      database: "",
      user: "",
      clientIp: "",
    },
    tables: {
      syncActiveHomes: { exists: false, count: 0 },
    },
    errors: [] as string[],
  }

  try {
    const pool = await getConnection()

    // Test basic connection info
    try {
      const connectionInfo = await pool.request().query(`
        SELECT 
          @@SERVERNAME as server_name,
          DB_NAME() as database_name,
          SUSER_SNAME() as login_name,
          CONNECTIONPROPERTY('client_net_address') as client_ip
      `)

      if (connectionInfo.recordset.length > 0) {
        const info = connectionInfo.recordset[0]
        debugInfo.connection.status = "connected"
        debugInfo.connection.server = info.server_name || "Unknown"
        debugInfo.connection.database = info.database_name || "Unknown"
        debugInfo.connection.user = info.login_name || "Unknown"
        debugInfo.connection.clientIp = info.client_ip || "Unknown"
      }
    } catch (error) {
      debugInfo.errors.push(`Connection info error: ${error instanceof Error ? error.message : "Unknown"}`)
    }

    // Test SyncActiveHomes table
    try {
      const tableTest = await pool.request().query(`
        SELECT COUNT(*) as total_count
        FROM SyncActiveHomes
      `)

      if (tableTest.recordset.length > 0) {
        debugInfo.tables.syncActiveHomes.exists = true
        debugInfo.tables.syncActiveHomes.count = tableTest.recordset[0].total_count || 0
      }
    } catch (error) {
      debugInfo.errors.push(`SyncActiveHomes table error: ${error instanceof Error ? error.message : "Unknown"}`)
    }

    return NextResponse.json(debugInfo)
  } catch (error) {
    console.error("Error debugging connection:", error)
    debugInfo.errors.push(`General error: ${error instanceof Error ? error.message : "Unknown"}`)
    return NextResponse.json(debugInfo, { status: 500 })
  }
}
