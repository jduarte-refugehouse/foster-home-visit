import { NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function GET() {
  try {
    // This query assumes your 'Homes' table has 'HomeID', 'Address', 'City', 'State', 'ZipCode' columns.
    // Adjust the table and column names as per your actual schema.
    const result = await query(`
      SELECT
        HomeID as id,
        Address as address,
        City as city,
        State as state,
        ZipCode as zipCode
      FROM Homes;
    `)

    if (result.success) {
      return NextResponse.json({ success: true, data: result.data })
    } else {
      return NextResponse.json({ success: false, message: result.message }, { status: 500 })
    }
  } catch (error: any) {
    console.error("API Homes List Error:", error)
    return NextResponse.json(
      { success: false, message: error.message || "An unknown error occurred." },
      { status: 500 },
    )
  }
}
