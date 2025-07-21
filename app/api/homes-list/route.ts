import { NextResponse } from "next/server"
import { getHomesList, processHomesForDisplay } from "@/lib/db-extensions"

export async function GET() {
  try {
    console.log("📋 [API] Homes list endpoint called")

    // Use extension functions instead of directly calling the locked db
    const rawHomes = await getHomesList()
    const homes = processHomesForDisplay(rawHomes)

    console.log(`✅ [API] Successfully processed ${homes.length} homes for list`)

    return NextResponse.json({
      success: true,
      homes,
      total: homes.length,
      debug: {
        timestamp: new Date().toISOString(),
      },
    })
  } catch (error: any) {
    console.error("❌ [API] Error in homes-list:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        homes: [],
        total: 0,
      },
      { status: 500 },
    )
  }
}
