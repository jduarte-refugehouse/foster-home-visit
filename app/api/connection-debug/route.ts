import { type NextRequest, NextResponse } from "next/server"
import { headers } from "next/headers"
import { getConnection, testConnection } from "@refugehouse/shared-core/db"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const headersList = await headers()

    console.log("Connection debug endpoint called")

    const debugInfo = {
      timestamp: new Date().toISOString(),
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        DATABASE_SERVER: process.env.DATABASE_SERVER,
        DATABASE_NAME: process.env.DATABASE_NAME,
        DATABASE_USER: process.env.DATABASE_USER,
        DATABASE_PORT: process.env.DATABASE_PORT,
        AZURE_KEY_VAULT_NAME: process.env.AZURE_KEY_VAULT_NAME,
        VERCEL_STATIC_IPS: "18.217.75.119, 18.116.232.18 (whitelisted in Azure SQL)",
        hasPassword: !!process.env.DATABASE_PASSWORD,
      },
      connection: {
        tested: false,
        successful: false,
        error: null,
        details: null,
      },
    }

    // Test connection
    try {
      debugInfo.connection.tested = true
      debugInfo.connection.successful = await testConnection()

      if (debugInfo.connection.successful) {
        const pool = await getConnection()
        const result = await pool.request().query(`
          SELECT 
            SUSER_SNAME() as login_name,
            DB_NAME() as database_name,
            GETDATE() as current_time,
            @@VERSION as version
        `)
        debugInfo.connection.details = result.recordset[0]
      }
    } catch (error) {
      debugInfo.connection.error = error instanceof Error ? error.message : "Unknown error"
    }

    return NextResponse.json(debugInfo)
  } catch (error) {
    console.error("Connection debug error:", error)
    return NextResponse.json(
      {
        error: "Debug failed",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
