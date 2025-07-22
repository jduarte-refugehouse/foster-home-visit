import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { getHomesForMap, getHomeStats } from "@/lib/db-extensions"

export async function GET() {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const [homes, stats] = await Promise.all([getHomesForMap(), getHomeStats()])

    return NextResponse.json({
      homes,
      stats,
    })
  } catch (error) {
    console.error("Error in homes-for-map API:", error)
    return NextResponse.json({ error: "Failed to fetch map data" }, { status: 500 })
  }
}
