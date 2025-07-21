import { NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function GET() {
  try {
    console.log("🏠 Fetching homes from SyncActiveHomes table...")

    const homes = await query(`
      SELECT 
        [HomeName], 
        [Street], 
        [City], 
        [State], 
        [Zip], 
        [HomePhone], 
        [Xref], 
        [CaseManager], 
        [Unit], 
        [Guid], 
        [CaseManagerEmail], 
        [CaseManagerPhone], 
        [CaregiverEmail], 
        [LastSync], 
        [Latitude], 
        [Longitude] 
      FROM SyncActiveHomes
    `)

    console.log(`✅ Successfully retrieved ${homes.length} homes from database`)

    return NextResponse.json({
      success: true,
      count: homes.length,
      homes: homes,
    })
  } catch (error: any) {
    console.error("❌ Error fetching homes:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        count: 0,
        homes: [],
      },
      { status: 500 },
    )
  }
}
