import { NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function GET() {
  try {
    // This query assumes your 'Homes' table has 'HomeID', 'Address', 'Latitude', and 'Longitude' columns.
    // Adjust the table and column names as per your actual schema.
    const result = await query(`
      SELECT
        HomeID as id,
        Address as address,
        Latitude as latitude,
        Longitude as longitude
      FROM Homes
      WHERE Latitude IS NOT NULL AND Longitude IS NOT NULL;
    `)

    if (result.success) {
      return NextResponse.json({ success: true, data: result.data })
    } else {
      return NextResponse.json({ success: false, message: result.message }, { status: 500 })
    }
  } catch (error: any) {
    console.error("API Homes for Map Error:", error)
    return NextResponse.json(
      { success: false, message: error.message || "An unknown error occurred." },
      { status: 500 },
    )
  }
}
