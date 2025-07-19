import { NextResponse } from "next/server"
import { query, testConnection, healthCheck, getConnectionInfo } from "@/lib/db"

export async function GET() {
  try {
    console.log("=== 🚀 Starting comprehensive database test ===")

    // Get connection info for debugging
    const connectionInfo = await getConnectionInfo()
    console.log("Connection info:", connectionInfo)

    // First do a health check
    const isHealthy = await healthCheck()
    console.log("Health check result:", isHealthy)

    if (!isHealthy) {
      return NextResponse.json(
        {
          success: false,
          message: "Database health check failed",
          error: "Unable to establish database connection",
          connectionInfo,
        },
        { status: 503 },
      )
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
          connectionInfo,
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
        @@SERVERNAME as server_name,
        @@LANGUAGE as language_setting,
        @@LOCK_TIMEOUT as lock_timeout
    `)

    // Try to list available tables
    console.log("📋 Fetching table list...")
    let tableList = []
    try {
      tableList = await query(`
        SELECT 
          TABLE_SCHEMA,
          TABLE_NAME,
          TABLE_TYPE
        FROM INFORMATION_SCHEMA.TABLES 
        WHERE TABLE_TYPE = 'BASE TABLE'
        ORDER BY TABLE_SCHEMA, TABLE_NAME
      `)
      console.log(`Found ${tableList.length} tables`)
    } catch (error) {
      console.error("Error fetching table list:", error)
    }

    // Try to query the specific table
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

    // Test SyncActiveHomes table as well
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
      connectionInfo,
      connectionTest: connectionTest.data,
      databaseInfo: dbInfo,
      tableList: tableList.slice(0, 20), // First 20 tables
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
