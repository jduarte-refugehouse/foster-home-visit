import { type NextRequest, NextResponse } from "next/server"
import { fetchHomesForMap, getUniqueCaseManagers } from "@/lib/db-extensions"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function GET(request: NextRequest) {
  console.log("🗺️ [API] Homes for map endpoint called")

  try {
    const { searchParams } = new URL(request.url)
    const unit = searchParams.get("unit") || undefined
    const caseManager = searchParams.get("caseManager") || undefined

    console.log("🔍 [API] Filters applied:", { unit, caseManager })

    const [homes, caseManagers] = await Promise.all([fetchHomesForMap({ unit, caseManager }), getUniqueCaseManagers()])

    console.log(`✅ [API] Successfully processed ${homes.length} homes for map`)

    return NextResponse.json({
      success: true,
      homes,
      caseManagers,
      summary: {
        total: homes.length,
        byUnit: homes.reduce(
          (acc, home) => {
            acc[home.Unit] = (acc[home.Unit] || 0) + 1
            return acc
          },
          {} as Record<string, number>,
        ),
      },
    })
  } catch (error) {
    console.error("❌ [API] Error in homes-for-map:", error)

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch homes for map",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
