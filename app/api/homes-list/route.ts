import { NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function GET() {
  try {
    const homes = await query(`
      SELECT 
        Id,
        Name,
        Address,
        City,
        State,
        ZipCode,
        Latitude,
        Longitude,
        PhoneNumber,
        Email,
        Website,
        Description,
        Capacity,
        ServicesOffered,
        ContactPersonName,
        ContactPersonTitle,
        IsActive,
        CreatedDate,
        ModifiedDate
      FROM Homes 
      WHERE IsActive = 1
      ORDER BY Name
    `)

    return NextResponse.json(homes)
  } catch (error: any) {
    console.error("Database error:", error)
    return NextResponse.json(
      {
        error: error.message,
      },
      { status: 500 },
    )
  }
}
