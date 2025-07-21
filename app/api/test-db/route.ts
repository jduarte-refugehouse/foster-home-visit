import { NextResponse } from "next/server"
import { getConnection } from "@/lib/db"

// Force Node.js runtime (not Edge)
export const runtime = "nodejs"

export async function GET() {
  try {
    console.log("=== 🚀 Starting database connection test ===")

    const pool = await getConnection()
    const result = await pool.request().query("SELECT GETDATE() AS CurrentDateTime")
    const currentTime = result.recordset[0].CurrentDateTime
    console.log("Database connection test result:", currentTime)

    console.log("✅ Database connection test passed")

    // Get database information
    console.log("📊 Fetching database information...")
    const dbInfo = await pool.request().query(`
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
      syncHomesData = await pool.request().query("SELECT TOP 10 * FROM dbo.SyncActiveHomesDisplay")
      console.log(`✅ Successfully retrieved ${syncHomesData.recordset.length} records from SyncActiveHomesDisplay`)
    } catch (error) {
      console.error("❌ Error querying SyncActiveHomesDisplay:", error)
      syncHomesError = error instanceof Error ? error.message : "Unknown error querying SyncActiveHomesDisplay"
    }

    // Test SyncActiveHomes table
    console.log("🏡 Testing SyncActiveHomes query...")
    let syncActiveHomesData = []
    let syncActiveHomesError = null

    try {
      syncActiveHomesData = await pool.request().query("SELECT TOP 5 * FROM dbo.SyncActiveHomes")
      console.log(`✅ Successfully retrieved ${syncActiveHomesData.recordset.length} records from SyncActiveHomes`)
    } catch (error) {
      console.error("❌ Error querying SyncActiveHomes:", error)
      syncActiveHomesError = error instanceof Error ? error.message : "Unknown error querying SyncActiveHomes"
    }

    console.log("=== ✅ Database test completed successfully ===")

    return NextResponse.json({
      success: true,
      message: "Database connection and queries successful",
      timestamp: new Date().toISOString(),
      connectionTest: currentTime.toISOString(),
      databaseInfo: dbInfo.recordset,
      syncActiveHomesDisplay: {
        success: !syncHomesError,
        error: syncHomesError,
        data: syncHomesData.recordset,
        count: syncHomesData.recordset.length,
      },
      syncActiveHomes: {
        success: !syncActiveHomesError,
        error: syncActiveHomesError,
        data: syncActiveHomesData.recordset,
        count: syncActiveHomesData.recordset.length,
      },
    })
  } catch (error: any) {
    console.error("=== ❌ Database test failed ===", error)
    return NextResponse.json(
      {
        success: false,
        message: error.message || "An unknown error occurred during database test.",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
