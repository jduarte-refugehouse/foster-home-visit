import { type NextRequest, NextResponse } from "next/server"
import { getHomesForMap } from "@/lib/db-extensions"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    console.log("🗺️ API: Homes for map endpoint called")

    const { searchParams } = new URL(request.url)
    const unit = searchParams.get("unit") || undefined
    const caseManager = searchParams.get("caseManager") || undefined

    console.log("🔍 API: Map filters applied:", { unit, caseManager })

    const filters = {
      unit: unit && unit !== "ALL" ? unit : undefined,
      caseManager: caseManager && caseManager !== "ALL" ? caseManager : undefined,
    }

    const homes = await getHomesForMap(filters)

    console.log(`✅ API: Successfully retrieved ${homes.length} homes for map`)

    return NextResponse.json({
      success: true,
      homes,
      count: homes.length,
      filters: filters,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("❌ API: Error in homes-for-map endpoint:", error)

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch homes data for map",
        message: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
