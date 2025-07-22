import { type NextRequest, NextResponse } from "next/server"
import { fetchHomesList } from "@/lib/db-extensions"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    console.log("🏠 API: Homes list endpoint called")

    const { searchParams } = new URL(request.url)
    const unit = searchParams.get("unit") || undefined
    const caseManager = searchParams.get("caseManager") || undefined
    const search = searchParams.get("search") || undefined

    console.log("🔍 API: Filters applied:", { unit, caseManager, search })

    const filters = {
      unit: unit && unit !== "ALL" ? unit : undefined,
      caseManager: caseManager && caseManager !== "ALL" ? caseManager : undefined,
      search: search || undefined,
    }

    const homes = await fetchHomesList(filters)

    console.log(`✅ API: Successfully retrieved ${homes.length} homes`)

    return NextResponse.json({
      success: true,
      homes,
      count: homes.length,
      filters: filters,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("❌ API: Error in homes-list endpoint:", error)

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch homes data",
        message: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
