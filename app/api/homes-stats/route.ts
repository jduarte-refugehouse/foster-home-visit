import { NextResponse } from "next/server"
import { getHomeStats } from "@/lib/db-extensions"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    console.log("📊 API: Fetching home statistics...")

    const stats = await getHomeStats()

    console.log("✅ API: Successfully retrieved home statistics")

    return NextResponse.json(stats)
  } catch (error) {
    console.error("❌ API: Error fetching home statistics:", error)

    return NextResponse.json(
      {
        error: "Failed to fetch home statistics",
        message: error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 },
    )
  }
}
