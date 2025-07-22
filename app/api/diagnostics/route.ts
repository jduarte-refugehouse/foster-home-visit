import { type NextRequest, NextResponse } from "next/server"
import { headers } from "next/headers"
import { testConnection, getConnection } from "@/lib/db"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const headersList = await headers()
    const userAgent = headersList.get("user-agent") || "Unknown"

    console.log("Diagnostics endpoint called")

    // Test database connection
    const isConnected = await testConnection()

    let connectionDetails = null
    if (isConnected) {
      try {
        const pool = await getConnection()
        const result = await pool.request().query(`
          SELECT 
            SUSER_SNAME() as login_name,
            DB_NAME() as database_name,
            @@VERSION as sql_version,
            GETDATE() as current_time
        `)
        connectionDetails = result.recordset[0]
      } catch (error) {
        console.error("Error getting connection details:", error)
      }
    }

    const diagnostics = {
      timestamp: new Date().toISOString(),
      database: {
        connected: isConnected,
        details: connectionDetails,
      },
      environment: {
        nodeEnv: process.env.NODE_ENV,
        hasKeyVault: !!process.env.AZURE_KEY_VAULT_NAME,
        hasFixieProxy: !!process.env.FIXIE_SOCKS_HOST,
        userAgent,
      },
      server: {
        platform: process.platform,
        nodeVersion: process.version,
      },
    }

    return NextResponse.json(diagnostics)
  } catch (error) {
    console.error("Diagnostics error:", error)
    return NextResponse.json(
      {
        error: "Diagnostics failed",
        message: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
