import { NextResponse } from "next/server"
import { getHomesList, processHomesForDisplay } from "@/lib/db-extensions"

export async function GET() {
  try {
    console.log("📋 [API] Homes list endpoint called")

    // Use the extension function instead of directly calling the locked db
    const homes = await getHomesList()
    const processedHomes = processHomesForDisplay(homes)

    console.log(`✅ [API] Successfully processed ${processedHomes.length} homes`)

    return NextResponse.json({
      success: true,
      homes: processedHomes,
      total: processedHomes.length,
      withCoordinates: processedHomes.filter((h) => h.hasCoordinates).length,
      timestamp: new Date().toISOString(),
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
