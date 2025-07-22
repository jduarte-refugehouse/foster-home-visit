import { type NextRequest, NextResponse } from "next/server"
import { headers } from "next/headers"
import { testConnection, getConnection } from "@/lib/db"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const headersList = await headers()
    const userAgent = headersList.get("user-agent") || "Unknown"

    console.log("🔍 Diagnostics endpoint called - performing real-time checks...")

    // Test database connection with actual query
    let isConnected = false
    let connectionDetails = null
    let dbError = null

    try {
      console.log("🔌 Testing database connection...")
      const testResult = await testConnection()
      isConnected = testResult.success

      if (isConnected) {
        console.log("✅ Database connection successful, getting details...")
        const pool = await getConnection()
        const result = await pool.request().query(`
          SELECT 
            SUSER_SNAME() as login_name,
            DB_NAME() as database_name,
            @@VERSION as sql_version,
            GETDATE() as current_time
        `)
        connectionDetails = result.recordset[0]
        console.log("📊 Database details retrieved:", connectionDetails)
      } else {
        dbError = testResult.message
        console.error("❌ Database connection failed:", dbError)
      }
    } catch (error) {
      console.error("❌ Error during database diagnostics:", error)
      isConnected = false
      dbError = error instanceof Error ? error.message : "Unknown database error"
    }

    const diagnostics = {
      timestamp: new Date().toISOString(),
      database: {
        connected: isConnected,
        details: connectionDetails,
        error: dbError,
      },
      environment: {
        nodeEnv: process.env.NODE_ENV || "unknown",
        hasKeyVault: !!(
          process.env.AZURE_KEY_VAULT_NAME &&
          process.env.AZURE_CLIENT_ID &&
          process.env.AZURE_CLIENT_SECRET &&
          process.env.AZURE_TENANT_ID
        ),
        hasFixieProxy: !!process.env.FIXIE_SOCKS_HOST,
        userAgent,
      },
      server: {
        platform: process.platform,
        nodeVersion: process.version,
      },
    }

    console.log("📋 Diagnostics completed:", {
      dbConnected: diagnostics.database.connected,
      hasKeyVault: diagnostics.environment.hasKeyVault,
      hasProxy: diagnostics.environment.hasFixieProxy,
    })

    return NextResponse.json(diagnostics)
  } catch (error) {
    console.error("❌ Diagnostics endpoint error:", error)
    return NextResponse.json(
      {
        error: "Diagnostics failed",
        message: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
        database: {
          connected: false,
          error: error instanceof Error ? error.message : "Unknown error",
        },
        environment: {
          nodeEnv: process.env.NODE_ENV || "unknown",
          hasKeyVault: !!(
            process.env.AZURE_KEY_VAULT_NAME &&
            process.env.AZURE_CLIENT_ID &&
            process.env.AZURE_CLIENT_SECRET &&
            process.env.AZURE_TENANT_ID
          ),
          hasFixieProxy: !!process.env.FIXIE_SOCKS_HOST,
          userAgent: "Unknown",
        },
        server: {
          platform: process.platform,
          nodeVersion: process.version,
        },
      },
      { status: 500 },
    )
  }
}
