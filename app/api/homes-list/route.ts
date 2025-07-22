import { NextResponse } from "next/server"
import { fetchHomesList } from "@/lib/db-extensions"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    console.log("🏠 API: Fetching homes list...")

    const homes = await fetchHomesList()

    console.log(`✅ API: Successfully retrieved ${homes.length} homes`)

    return NextResponse.json({
      success: true,
      count: homes.length,
      homes: homes,
    })
  } catch (error) {
    console.error("❌ API: Error fetching homes list:", error)

    return NextResponse.json(
      {
        success: false,
        count: 0,
        homes: [],
        error: error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 },
    )
  }
}
