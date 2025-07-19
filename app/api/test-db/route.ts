import { NextResponse } from "next/server"
import { query, testConnection } from "@/lib/db"

export async function GET() {
  try {
    console.log("Starting database test...")

    // First test basic connection
    const connectionTest = await testConnection()

    if (!connectionTest.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Database connection failed",
          error: connectionTest.message,
        },
        { status: 500 },
      )
    }

    console.log("Basic connection test passed, now testing SyncActiveHomesDisplay query...")

    // Try to query the specific table
    let syncHomesData = []
    let syncHomesError = null

    try {
      syncHomesData = await query("SELECT TOP 10 * FROM dbo.SyncActiveHomesDisplay")
      console.log(`Successfully retrieved ${syncHomesData.length} records from SyncActiveHomesDisplay`)
    } catch (error) {
      console.error("Error querying SyncActiveHomesDisplay:", error)
      syncHomesError = error instanceof Error ? error.message : "Unknown error querying SyncActiveHomesDisplay"
    }

    // Also get some basic database info
    const dbInfo = await query(`
      SELECT 
        DB_NAME() as database_name,
        @@VERSION as sql_version,
        GETDATE() as current_time,
        USER_NAME() as current_user
    `)

    return NextResponse.json({
      success: true,
      message: "Database connection successful",
      connectionTest: connectionTest.data,
      databaseInfo: dbInfo,
      syncActiveHomes: {
        success: !syncHomesError,
        error: syncHomesError,
        data: syncHomesData,
        count: syncHomesData.length,
      },
    })
  } catch (error) {
    console.error("Database test failed:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Database test failed",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
