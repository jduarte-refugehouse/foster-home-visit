import { NextResponse } from "next/server"
import { getAllHomes } from "@/lib/db-extensions"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    console.log("🏠 API: Fetching homes list...")
    const homes = await getAllHomes()

    console.log(`✅ API: Successfully retrieved ${homes.length} homes`)

    return NextResponse.json({
      success: true,
      homes,
      count: homes.length,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("❌ API: Error fetching homes list:", error)

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch homes",
        message: error instanceof Error ? error.message : "Unknown error",
        homes: [],
        count: 0,
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
