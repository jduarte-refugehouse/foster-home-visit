import { NextResponse } from "next/server"
import { fetchHomesForList, getUniqueCaseManagers } from "@/lib/db-extensions"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function GET(request: Request) {
  console.log("📋 [API] Homes list endpoint called")

  try {
    const { searchParams } = new URL(request.url)
    const unit = searchParams.get("unit") || undefined
    const caseManager = searchParams.get("caseManager") || undefined

    console.log("🔍 [API] Filters applied:", { unit, caseManager })

    const [homes, caseManagers] = await Promise.all([fetchHomesForList({ unit, caseManager }), getUniqueCaseManagers()])

    console.log(`✅ [API] Successfully processed ${homes.length} homes for list`)

    return NextResponse.json({
      success: true,
      homes,
      caseManagers,
      total: homes.length,
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
