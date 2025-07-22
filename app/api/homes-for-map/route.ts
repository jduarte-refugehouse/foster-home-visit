import { NextResponse } from "next/server"
import { getHomesForMap } from "@/lib/db-extensions"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    console.log("🗺️ Homes for map API endpoint called")
    const homes = await getHomesForMap()
    console.log(`✅ Successfully retrieved ${homes.length} homes for map`)
    return NextResponse.json(homes)
  } catch (error) {
    console.error("❌ Error in homes-for-map API:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch homes for map",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
