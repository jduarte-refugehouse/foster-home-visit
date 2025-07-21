import { NextResponse } from "next/server"
import { getConnection } from "@/lib/db"

export async function GET() {
  try {
    const pool = await getConnection()
    const request = pool.request()

    // Get current database name
    const dbNameResult = await request.query("SELECT DB_NAME() AS CurrentDatabase")
    const currentDatabase = dbNameResult.recordset[0].CurrentDatabase

    // Get server name
    const serverNameResult = await request.query("SELECT @@SERVERNAME AS ServerName")
    const serverName = serverNameResult.recordset[0].ServerName

    // Get client IP address (as seen by the SQL Server)
    const clientIpResult = await request.query(
      "SELECT CLIENT_NET_ADDRESS FROM SYS.DM_EXEC_CONNECTIONS WHERE SESSION_ID = @@SPID",
    )
    const clientIp = clientIpResult.recordset[0].CLIENT_NET_ADDRESS

    // Get SQL Server version
    const versionResult = await request.query("SELECT @@VERSION AS SqlVersion")
    const sqlVersion = versionResult.recordset[0].SqlVersion

    // Check connection properties (e.g., encryption)
    const encryptionResult = await request.query(
      "SELECT net_transport, encrypt_option FROM sys.dm_exec_connections WHERE session_id = @@SPID",
    )
    const connectionDetails = encryptionResult.recordset[0]

    return NextResponse.json({
      success: true,
      database: currentDatabase,
      server: serverName,
      clientIp: clientIp,
      sqlVersion: sqlVersion,
      connectionDetails: connectionDetails,
      message: "Database connection details retrieved successfully.",
    })
  } catch (error: any) {
    console.error("Error debugging connection:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
