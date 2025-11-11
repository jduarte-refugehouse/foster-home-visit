import { NextResponse, type NextRequest } from "next/server"
import { query } from "@/lib/db"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

/**
 * GET - Look up phone number and email from EntityCommunicationBridge
 * Query parameters:
 * - entityGuid: Person GUID (optional)
 * - entityName: Person name (optional, used for fuzzy matching)
 * - fosterFacilityGuid: Foster home GUID (required)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const entityGuid = searchParams.get("entityGuid")
    const entityName = searchParams.get("entityName")
    const fosterFacilityGuid = searchParams.get("fosterFacilityGuid")

    if (!fosterFacilityGuid) {
      return NextResponse.json(
        { error: "fosterFacilityGuid is required" },
        { status: 400 }
      )
    }

    // Build query based on available parameters
    // Note: EntityCommunicationBridge uses FosterFacilityGUID (not FosterHomeGUID)
    let queryText = `
      SELECT TOP 1
        EntityFullName,
        PrimaryMobilePhone,
        PrimaryMobilePhoneE164,
        EmailAddress
      FROM dbo.EntityCommunicationBridge
      WHERE FosterFacilityGUID = @param0
        AND is_deleted = 0
    `
    const params: any[] = [fosterFacilityGuid]
    let paramIndex = 1

    if (entityGuid) {
      queryText += ` AND EntityGUID = @param${paramIndex}`
      params.push(entityGuid)
      paramIndex++
    } else if (entityName) {
      // Fuzzy match on name (case-insensitive, partial match)
      queryText += ` AND EntityFullName LIKE @param${paramIndex}`
      params.push(`%${entityName}%`)
      paramIndex++
    }

    queryText += ` ORDER BY EntityFullName`

    const results = await query(queryText, params)

    if (results.length === 0) {
      return NextResponse.json({
        success: true,
        found: false,
        data: null,
      })
    }

    const contact = results[0]

    return NextResponse.json({
      success: true,
      found: true,
      data: {
        name: contact.EntityFullName,
        phone: contact.PrimaryMobilePhone || contact.PrimaryMobilePhoneE164 || null,
        email: contact.EmailAddress || null,
      },
    })
  } catch (error: any) {
    console.error("Error looking up entity communication:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to look up contact information",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}

