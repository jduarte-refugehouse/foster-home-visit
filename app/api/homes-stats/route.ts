import { NextResponse } from "next/server"
import { getHomeStats } from "@/lib/db-extensions"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    console.log("📊 Fetching home statistics...")
    const stats = await getHomeStats()
    console.log("✅ Successfully fetched home stats:", stats)
    return NextResponse.json(stats)
  } catch (error) {
    console.error("❌ Error in homes-stats API:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch home statistics",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
