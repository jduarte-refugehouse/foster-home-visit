import { NextResponse } from "next/server"
import { query, testConnection, healthCheck, forceReconnect } from "@/lib/db"

// Force Node.js runtime (not Edge)
export const runtime = "nodejs"

export async function GET() {
  try {
    console.log("=== 🚀 Starting database connection test ===")

    // First do a health check
    console.log("🏥 Running health check...")
    const isHealthy = await healthCheck()
    console.log("Health check result:", isHealthy)

    if (!isHealthy) {
      console.log("🔄 Health check failed, trying force reconnect...")
      await forceReconnect()

      // Try health check again after force reconnect
      const isHealthyAfterReconnect = await healthCheck()
      if (!isHealthyAfterReconnect) {
        return NextResponse.json(
          {
            success: false,
            message: "Database health check failed even after reconnection attempt",
            error: "Unable to establish database connection",
          },
          { status: 503 },
        )
      }
    }

    // Test basic connection
    console.log("🔍 Running basic connection test...")
    const connectionTest = await testConnection()

    if (!connectionTest.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Database connection test failed",
          error: connectionTest.message,
        },
        { status: 500 },
      )
    }

    console.log("✅ Basic connection test passed")

    // Get database information
    console.log("📊 Fetching database information...")
    const dbInfo = await query(`
      SELECT 
        DB_NAME() as database_name,
        @@VERSION as sql_version,
        GETDATE() as current_time,
        USER_NAME() as current_user,
        @@SERVERNAME as server_name
    `)

    // Try to query the specific tables with individual error handling
    console.log("🏠 Testing SyncActiveHomesDisplay query...")
    let syncHomesData = []
    let syncHomesError = null

    try {
      syncHomesData = await query("SELECT TOP 10 * FROM dbo.SyncActiveHomesDisplay")
      console.log(`✅ Successfully retrieved ${syncHomesData.length} records from SyncActiveHomesDisplay`)
    } catch (error) {
      console.error("❌ Error querying SyncActiveHomesDisplay:", error)
      syncHomesError = error instanceof Error ? error.message : "Unknown error querying SyncActiveHomesDisplay"
    }

    // Test SyncActiveHomes table
    console.log("🏡 Testing SyncActiveHomes query...")
    let syncActiveHomesData = []
    let syncActiveHomesError = null

    try {
      syncActiveHomesData = await query("SELECT TOP 5 * FROM dbo.SyncActiveHomes")
      console.log(`✅ Successfully retrieved ${syncActiveHomesData.length} records from SyncActiveHomes`)
    } catch (error) {
      console.error("❌ Error querying SyncActiveHomes:", error)
      syncActiveHomesError = error instanceof Error ? error.message : "Unknown error querying SyncActiveHomes"
    }

    console.log("=== ✅ Database test completed successfully ===")

    return NextResponse.json({
      success: true,
      message: "Database connection and queries successful",
      timestamp: new Date().toISOString(),
      connectionTest: connectionTest.data,
      databaseInfo: dbInfo,
      syncActiveHomesDisplay: {
        success: !syncHomesError,
        error: syncHomesError,
        data: syncHomesData,
        count: syncHomesData.length,
      },
      syncActiveHomes: {
        success: !syncActiveHomesError,
        error: syncActiveHomesError,
        data: syncActiveHomesData,
        count: syncActiveHomesData.length,
      },
    })
  } catch (error) {
    console.error("=== ❌ Database test failed ===", error)
    return NextResponse.json(
      {
        success: false,
        message: "Database test failed",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
