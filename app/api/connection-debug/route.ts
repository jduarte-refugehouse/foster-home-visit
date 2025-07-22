import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { getDbConnection } from "@/lib/db"

export async function GET() {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const debug = {
      timestamp: new Date().toISOString(),
      userId,
      connectionTest: { status: "unknown", details: "" },
      environmentCheck: {
        hasAzureClientId: !!process.env.AZURE_CLIENT_ID,
        hasAzureClientSecret: !!process.env.AZURE_CLIENT_SECRET,
        hasAzureTenantId: !!process.env.AZURE_TENANT_ID,
        hasKeyVaultName: !!process.env.AZURE_KEY_VAULT_NAME,
        nodeEnv: process.env.NODE_ENV,
      },
    }

    try {
      const pool = await getDbConnection()
      const result = await pool.request().query(`
        SELECT 
          COUNT(*) as home_count,
          @@VERSION as sql_version,
          DB_NAME() as database_name
      `)

      debug.connectionTest = {
        status: "success",
        details: `Connected to ${result.recordset[0].database_name}, found ${result.recordset[0].home_count} homes`,
      }
    } catch (dbError) {
      debug.connectionTest = {
        status: "error",
        details: dbError instanceof Error ? dbError.message : "Unknown database error",
      }
    }

    return NextResponse.json(debug)
  } catch (error) {
    console.error("Connection debug error:", error)
    return NextResponse.json({ error: "Failed to run connection debug" }, { status: 500 })
  }
}
