import { NextResponse } from "next/server"
import { fetchHomesList } from "@/lib/db-extensions"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    console.log("🏠 [API] Homes list endpoint called")

    const homes = await fetchHomesList()

    console.log(`✅ [API] Successfully retrieved ${homes.length} homes`)

    return NextResponse.json({
      success: true,
      count: homes.length,
      homes,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("❌ [API] Error in homes-list:", error)

    return NextResponse.json(
      {
        success: false,
        count: 0,
        homes: [],
        error: error instanceof Error ? error.message : "Unknown error occurred",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
