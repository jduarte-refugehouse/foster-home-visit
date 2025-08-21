import { NextResponse } from "next/server"
import { query } from "@/lib/db"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

// GET - Fetch homes for appointment assignment
export async function GET() {
  try {
    console.log("🏠 [API] Fetching homes for appointment assignment")

    const homes = await query(`
      SELECT 
        Xref,
        HomeName,
        Street,
        City,
        State,
        Zip,
        Unit,
        CaseManager,
        HomePhone,
        CaseManagerEmail,
        CaseManagerPhone,
        Latitude,
        Longitude
      FROM SyncActiveHomes
      WHERE HomeName IS NOT NULL AND HomeName != ''
      ORDER BY HomeName
    `)

    console.log(`✅ [API] Retrieved ${homes.length} homes`)

    return NextResponse.json({
      success: true,
      count: homes.length,
      homes: homes.map((home) => ({
        xref: home.Xref,
        name: home.HomeName,
        address: `${home.Street || ""}, ${home.City || ""}, ${home.State || ""} ${home.Zip || ""}`
          .trim()
          .replace(/^,\s*/, ""),
        fullAddress: {
          street: home.Street,
          city: home.City,
          state: home.State,
          zip: home.Zip,
        },
        unit: home.Unit,
        caseManager: home.CaseManager,
        phone: home.HomePhone,
        caseManagerEmail: home.CaseManagerEmail,
        caseManagerPhone: home.CaseManagerPhone,
        coordinates:
          home.Latitude && home.Longitude
            ? {
                lat: Number.parseFloat(home.Latitude),
                lng: Number.parseFloat(home.Longitude),
              }
            : null,
      })),
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("❌ [API] Error fetching homes:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch homes",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
