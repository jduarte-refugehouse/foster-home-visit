import { NextResponse } from "next/server"
import { getHomesList } from "@/lib/db-extensions"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    console.log("🏠 Fetching homes list...")
    const homes = await getHomesList()
    console.log(`✅ Successfully fetched ${homes.length} homes`)
    return NextResponse.json(homes)
  } catch (error) {
    console.error("❌ Error in homes-list API:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch homes",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
