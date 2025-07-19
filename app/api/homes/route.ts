import { NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function GET() {
  try {
    console.log("Fetching homes from SyncActiveHomes table...")

    // Query the SyncActiveHomes table
    const homes = await query("SELECT TOP 10 * FROM dbo.SyncActiveHomes")

    console.log(`Successfully retrieved ${homes.length} homes`)

    return NextResponse.json({
      success: true,
      homes,
      count: homes.length,
    })
  } catch (error) {
    console.error("Database query error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch homes",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
