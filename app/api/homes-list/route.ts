import { NextResponse } from "next/server"
import { getAllHomes } from "@/lib/db-extensions"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    console.log("📋 Homes list API endpoint called")
    const homes = await getAllHomes()
    console.log(`✅ Successfully retrieved ${homes.length} homes`)
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
