import { type NextRequest, NextResponse } from "next/server"
import { getHomeStats } from "@/lib/db-extensions"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const stats = await getHomeStats()

    return NextResponse.json(stats)
  } catch (error) {
    console.error("Error fetching homes stats:", error)
    return NextResponse.json({ error: "Failed to fetch home statistics" }, { status: 500 })
  }
}
