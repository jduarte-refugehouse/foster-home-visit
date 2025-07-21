import { NextResponse } from "next/server"
import { getHomesForMap, getCaseManagers, groupHomesByUnit } from "@/lib/db-extensions"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const unitFilter = searchParams.get("unit")?.toUpperCase()
    const caseManagerFilter = searchParams.get("caseManager")

    console.log("🗺️ [API] Homes for map endpoint called")
    console.log(`🔍 [API] Filters - Unit: ${unitFilter || "ALL"}, Case Manager: ${caseManagerFilter || "ALL"}`)

    // Use extension functions instead of directly calling the locked db
    const homes = await getHomesForMap({
      unit: unitFilter || undefined,
      caseManager: caseManagerFilter || undefined,
    })

    const caseManagers = await getCaseManagers()
    const unitSummary = groupHomesByUnit(homes)

    console.log(`✅ [API] Successfully processed ${homes.length} homes for map`)

    return NextResponse.json({
      success: true,
      homes,
      total: homes.length,
      unitSummary,
      caseManagers,
      filter: {
        unit: unitFilter || "ALL",
        caseManager: caseManagerFilter || "ALL",
      },
      debug: {
        validCount: homes.length,
        timestamp: new Date().toISOString(),
      },
    })
  } catch (error: any) {
    console.error("❌ [API] Error in homes-for-map:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        homes: [],
        total: 0,
      },
      { status: 500 },
    )
  }
}
