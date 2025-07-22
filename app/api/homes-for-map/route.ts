import { type NextRequest, NextResponse } from "next/server"
import { getHomesForMap } from "@/lib/db-extensions"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const homes = await getHomesForMap()

    return NextResponse.json({
      homes,
      count: homes.length,
    })
  } catch (error) {
    console.error("Error in homes-for-map API:", error)
    return NextResponse.json({ error: "Failed to fetch homes for map" }, { status: 500 })
  }
}
