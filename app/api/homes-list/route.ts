import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { getActiveHomes, getUnits, getCaseManagers } from "@/lib/db-extensions"

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const unit = searchParams.get("unit") || undefined
    const caseManager = searchParams.get("caseManager") || undefined
    const search = searchParams.get("search") || undefined

    const filters = {
      unit: unit && unit !== "all" ? unit : undefined,
      caseManager: caseManager && caseManager !== "all" ? caseManager : undefined,
      search: search || undefined,
    }

    const [homes, units, caseManagers] = await Promise.all([getActiveHomes(filters), getUnits(), getCaseManagers()])

    return NextResponse.json({
      homes,
      filters: {
        units,
        caseManagers,
      },
    })
  } catch (error) {
    console.error("Error in homes-list API:", error)
    return NextResponse.json({ error: "Failed to fetch homes data" }, { status: 500 })
  }
}
