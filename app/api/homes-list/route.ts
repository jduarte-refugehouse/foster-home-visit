import { type NextRequest, NextResponse } from "next/server"
import { fetchHomesList } from "@/lib/db-extensions"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function GET(request: NextRequest) {
  console.log("📋 [API] Homes list endpoint called")

  try {
    const { searchParams } = new URL(request.url)
    const unit = searchParams.get("unit") || undefined
    const caseManager = searchParams.get("caseManager") || undefined
    const search = searchParams.get("search") || undefined

    console.log("🔍 [API] Filters:", { unit, caseManager, search })

    const homes = await fetchHomesList({ unit, caseManager, search })

    console.log(`✅ [API] Successfully fetched ${homes.length} homes for list`)

    return NextResponse.json({
      success: true,
      homes,
      count: homes.length,
    })
  } catch (error) {
    console.error("❌ [API] Error in homes-list:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch homes list",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
