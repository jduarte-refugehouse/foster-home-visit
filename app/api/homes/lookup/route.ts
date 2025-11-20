import { NextResponse } from "next/server"
import { query } from "@refugehouse/shared-core/db"

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const xref = searchParams.get("xref")

    if (!xref) {
      return NextResponse.json(
        { success: false, error: "Missing xref parameter" },
        { status: 400 }
      )
    }

    console.log(`🔍 [API] Looking up home GUID for xref: ${xref}`)

    // Look up GUID from syncActiveHomes using Xref
    const result = await query(
      `
      SELECT TOP 1
        Guid as guid,
        HomeName as name,
        Xref as xref
      FROM syncActiveHomes
      WHERE Xref = @param0
      `,
      [parseInt(xref)]
    )

    if (!result || result.length === 0) {
      console.warn(`⚠️ [API] No home found for xref: ${xref}`)
      return NextResponse.json(
        { success: false, error: "Home not found for this xref" },
        { status: 404 }
      )
    }

    console.log(`✅ [API] Found home: ${result[0].name} (${result[0].guid})`)

    return NextResponse.json({
      success: true,
      guid: result[0].guid,
      name: result[0].name,
      xref: result[0].xref,
    })

  } catch (error: any) {
    console.error("❌ [API] Error looking up home GUID:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to lookup home GUID",
        details: error.message,
      },
      { status: 500 }
    )
  }
}

