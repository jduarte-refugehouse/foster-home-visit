import { NextResponse } from "next/server"
import { getHomesForMap } from "@/lib/db-extensions"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    console.log("🗺️ Fetching homes for map...")
    const homes = await getHomesForMap()
    console.log(`✅ Successfully fetched ${homes.length} homes with coordinates`)
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
