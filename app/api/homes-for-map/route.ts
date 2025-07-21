import { NextResponse } from "next/server"
import { getConnection } from "@/lib/db"

export async function GET() {
  try {
    const pool = await getConnection()
    const result = await pool.request().query(`
      SELECT
        Guid AS id,
        HomeName AS address,
        City AS city,
        State AS state,
        Zip AS zip,
        Latitude AS latitude,
        Longitude AS longitude
      FROM Homes
      WHERE Latitude IS NOT NULL AND Longitude IS NOT NULL
    `)
    return NextResponse.json({ success: true, homes: result.recordset })
  } catch (error: any) {
    console.error("Error fetching homes for map:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
