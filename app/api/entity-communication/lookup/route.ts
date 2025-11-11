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
    // EntityGUID should match SyncCurrentFosterFacility.PersonGUID
    // Use IsActive = 1 to filter active records (no is_deleted column in this table)
    console.log(`🔍 [EntityCommunication] Looking up contact info:`, {
      entityGuid,
      entityName,
      fosterFacilityGuid,
    })

    let queryText = `
      SELECT TOP 1
        EntityGUID,
        EntityFullName,
        PrimaryMobilePhone,
        PrimaryMobilePhoneE164,
        EmailAddress
      FROM dbo.EntityCommunicationBridge
      WHERE FosterFacilityGUID = @param0
        AND IsActive = 1
    `
    const params: any[] = [fosterFacilityGuid]
    let paramIndex = 1

    if (entityGuid) {
      // EntityGUID should match SyncCurrentFosterFacility.PersonGUID
      // Both are uniqueidentifier type, so direct comparison should work
      queryText += ` AND EntityGUID = CAST(@param${paramIndex} AS uniqueidentifier)`
      params.push(entityGuid)
      paramIndex++
      console.log(`🔍 [EntityCommunication] Using EntityGUID match: ${entityGuid} (type: ${typeof entityGuid})`)
    } else if (entityName) {
      // Fuzzy match on name (case-insensitive, partial match)
      queryText += ` AND EntityFullName LIKE @param${paramIndex}`
      params.push(`%${entityName}%`)
      paramIndex++
      console.log(`🔍 [EntityCommunication] Using name fuzzy match: ${entityName}`)
    }

    queryText += ` ORDER BY EntityFullName`

    console.log(`🔍 [EntityCommunication] Query:`, queryText)
    console.log(`🔍 [EntityCommunication] Params:`, params)

    const results = await query(queryText, params)
    
    console.log(`🔍 [EntityCommunication] Results:`, results.length, results.length > 0 ? results[0] : 'none')

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

