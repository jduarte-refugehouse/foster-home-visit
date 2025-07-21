import { NextResponse } from "next/server"
import { getConnection } from "@/lib/db"

export async function GET() {
  try {
    const pool = await getConnection()
    const result = await pool.request().query(`
      SELECT
        Guid,
        HomeName,
        Street,
        City,
        State,
        Zip,
        Unit,
        CaseManager
      FROM Homes
    `)
    return NextResponse.json({ success: true, homes: result.recordset })
  } catch (error: any) {
    console.error("Error fetching homes list:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
