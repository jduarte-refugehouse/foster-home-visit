import { NextResponse, type NextRequest } from "next/server"
import { query } from "@refugehouse/shared-core/db"

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

    // Build query based on available parameters
    // PRIMARY MATCH: EntityGUID (PersonGUID from SyncCurrentFosterFacility)
    // This is the most reliable match since EntityGUID is enforced
    // FosterFacilityGUID is NOT enforced, so we use it only as a secondary filter if provided
    console.log(`🔍 [EntityCommunication] Looking up contact info:`, {
      entityGuid,
      entityName,
      fosterFacilityGuid,
      note: "EntityGUID is primary match (enforced), FosterFacilityGUID is secondary (not enforced)"
    })

    // PRIMARY MATCH: EntityGUID is required (enforced field)
    // This should match SyncCurrentFosterFacility.PersonGUID
    let queryText = `
      SELECT TOP 1
        EntityGUID,
        EntityFullName,
        PrimaryMobilePhone,
        PrimaryMobilePhoneE164,
        EmailAddress
      FROM dbo.EntityCommunicationBridge
      WHERE IsActive = 1
    `
    const params: any[] = []
    let paramIndex = 0

    if (entityGuid) {
      // PRIMARY: EntityGUID should match SyncCurrentFosterFacility.PersonGUID
      // This is the most reliable match since EntityGUID is enforced in the table
      queryText += ` AND EntityGUID = CAST(@param${paramIndex} AS uniqueidentifier)`
      params.push(entityGuid)
      paramIndex++
      console.log(`🔍 [EntityCommunication] Using EntityGUID match: ${entityGuid} (type: ${typeof entityGuid})`)
    } else if (entityName) {
      // Fallback: Fuzzy match on name (case-insensitive, partial match)
      queryText += ` AND EntityFullName LIKE @param${paramIndex}`
      params.push(`%${entityName}%`)
      paramIndex++
      console.log(`🔍 [EntityCommunication] Using name fuzzy match: ${entityName}`)
    } else {
      // If no entityGuid or entityName, we can't reliably find the person
      return NextResponse.json(
        { 
          success: false,
          error: "entityGuid or entityName is required for lookup" 
        },
        { status: 400 }
      )
    }

    // SECONDARY: FosterFacilityGUID is NOT enforced, so only use as additional filter if provided
    // This helps narrow down results if there are multiple matches, but shouldn't be required
    if (fosterFacilityGuid) {
      queryText += ` AND (FosterFacilityGUID IS NULL OR FosterFacilityGUID = CAST(@param${paramIndex} AS uniqueidentifier))`
      params.push(fosterFacilityGuid)
      paramIndex++
      console.log(`🔍 [EntityCommunication] Using FosterFacilityGUID as secondary filter: ${fosterFacilityGuid}`)
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

