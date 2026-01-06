/**
 * Visits API Hub - Creates ContinuumMark + MarkSubject + MarkParty
 * Route: admin.refugehouse.app/api/radius/visits
 * 
 * IMPORTANT: Uses existing ContinuumMark schema with both PID and GUID fields
 * - MarkDate (not MarkTime) for timestamps
 * - ActorPID is NOT NULL - use 0 for web-only users
 * - SourceSystem = 'VisitService' for new marks
 */

import { NextResponse, type NextRequest } from "next/server"
import { query } from "@refugehouse/shared-core/db"
import { validateApiKey } from "@/lib/api-auth"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"
export const maxDuration = 60

export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    // 1. Validate API key
    const apiKeyRaw = request.headers.get("x-api-key")
    const apiKey = apiKeyRaw?.trim() || null
    const validation = await validateApiKey(apiKey)

    if (!validation.valid) {
      console.warn(`🚫 [RADIUS-API] Invalid API key attempt: ${validation.error}`)
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
          details: validation.error || "Invalid API key",
        },
        { status: 401 }
      )
    }

    console.log(
      `✅ [RADIUS-API] Authenticated request from microservice: ${validation.key?.microservice_code}`
    )

    const body = await request.json()
    const {
      // Visit data
      markDate,                    // Use MarkDate (existing column name)
      markType = 'HOME_VISIT',
      fosterHomeGuid,
      fosterHomeName,
      fosterHomeXref,
      childGuids = [],
      notes,
      jsonPayload,
      unit,
      sourceSystem = 'VisitService',

      // Actor identity (dual-source pattern)
      actorPid,                    // For PULSE compatibility
      actorClerkId,
      actorRadiusGuid,
      actorEntityGuid,
      actorCommBridgeId,
      actorName,
      actorEmail,
      actorUserType,

      // Parties present
      parties = []
    } = body

    // 2. Create ContinuumMark (using existing + new columns)
    const markResult = await query(
      `INSERT INTO ContinuumMark (
         MarkType, MarkDate, Unit, SourceSystem,
         ActorPID,
         ActorClerkId, ActorRadiusGuid, ActorEntityGuid, ActorCommBridgeId,
         ActorName, ActorEmail, ActorUserType,
         Notes, JsonPayload, MarkStatus, CreatedBy, CreatedAt, IsArchived, IsDeleted
       )
       OUTPUT INSERTED.MarkID
       VALUES (
         @param0, @param1, @param2, @param3,
         @param4,
         @param5, @param6, @param7, @param8,
         @param9, @param10, @param11,
         @param12, @param13, @param14, @param15, GETUTCDATE(), 0, 0
       )`,
      [
        markType, markDate, unit, sourceSystem,
        actorPid || 0,  // ActorPID is NOT NULL, use 0 for web-only users
        actorClerkId, actorRadiusGuid, actorEntityGuid, actorCommBridgeId,
        actorName, actorEmail, actorUserType,
        notes, jsonPayload ? JSON.stringify(jsonPayload) : null, 'active', actorClerkId
      ]
    )

    const markId = markResult[0].MarkID

    // 3. Create MarkSubject for foster home
    if (fosterHomeGuid) {
      await query(
        `INSERT INTO MarkSubject (MarkID, EntityGUID, EntityType, SubjectRole, EntityName, EntityXref, CreatedAt)
         VALUES (@param0, @param1, 'facility', 'primary', @param2, @param3, GETUTCDATE())`,
        [markId, fosterHomeGuid, fosterHomeName || null, fosterHomeXref || null]
      )
    }

    // 4. Create MarkSubject for each child
    for (const child of childGuids) {
      if (child.guid) {
        await query(
          `INSERT INTO MarkSubject (MarkID, EntityGUID, EntityType, SubjectRole, EntityName, CreatedAt)
           VALUES (@param0, @param1, 'child', 'participant', @param2, GETUTCDATE())`,
          [markId, child.guid, child.name || null]
        )
      }
    }

    // 5. Create MarkParty for each attendee
    for (const party of parties) {
      if (party.name) {
        await query(
          `INSERT INTO MarkParty (
             MarkID, PartyName, PartyRole,
             EntityGUID, PartyRadiusGuid, PartyEntityGuid, PartyCommBridgeId,
             PartyType, PartyEmail, PartyPhone, CreatedAt
           )
           VALUES (@param0, @param1, @param2, @param3, @param4, @param5, @param6, @param7, @param8, @param9, GETUTCDATE())`,
          [
            markId,
            party.name,
            party.role || 'PRESENT',
            party.entityGuid || null,
            party.radiusGuid || null,
            party.entityGuid || null,
            party.commBridgeId || null,
            party.type || 'unknown',
            party.email || null,
            party.phone || null
          ]
        )
      }
    }

    const duration = Date.now() - startTime
    console.log(`✅ [RADIUS-API] Created visit mark ${markId} in ${duration}ms`)

    return NextResponse.json({
      success: true,
      markId,
      message: "Visit mark created successfully",
      timestamp: new Date().toISOString(),
      duration_ms: duration
    }, { status: 201 })

  } catch (error) {
    const duration = Date.now() - startTime
    console.error("❌ [RADIUS-API] Error creating visit mark:", error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString(),
      duration_ms: duration
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  const startTime = Date.now()

  try {
    // 1. Validate API key
    const apiKeyRaw = request.headers.get("x-api-key")
    const apiKey = apiKeyRaw?.trim() || null
    const validation = await validateApiKey(apiKey)

    if (!validation.valid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const homeGuid = searchParams.get('homeGuid')
    const staffGuid = searchParams.get('staffGuid')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Build dynamic query
    let whereConditions = ["cm.IsArchived = 0", "cm.IsDeleted = 0"]
    const params: any[] = []
    let paramIndex = 0

    if (homeGuid) {
      // Join with MarkSubject to filter by foster home
      whereConditions.push(`ms.EntityGUID = @param${paramIndex} AND ms.EntityType = 'facility'`)
      params.push(homeGuid)
      paramIndex++
    }

    if (staffGuid) {
      whereConditions.push(`cm.ActorRadiusGuid = @param${paramIndex}`)
      params.push(staffGuid)
      paramIndex++
    }

    if (startDate) {
      whereConditions.push(`cm.MarkDate >= @param${paramIndex}`)
      params.push(startDate)
      paramIndex++
    }

    if (endDate) {
      whereConditions.push(`cm.MarkDate <= @param${paramIndex}`)
      params.push(endDate)
      paramIndex++
    }

    // Use the vw_VisitDetails view if available, otherwise query directly
    let queryText = `
      SELECT 
        cm.MarkID,
        cm.MarkType,
        cm.MarkDate,
        cm.Unit,
        cm.SourceSystem,
        cm.ActorPID,
        cm.ActorClerkId,
        cm.ActorRadiusGuid,
        cm.ActorEntityGuid,
        cm.ActorCommBridgeId,
        cm.ActorName,
        cm.ActorEmail,
        cm.ActorUserType,
        cm.Notes,
        cm.JsonPayload,
        cm.MarkStatus,
        cm.CreatedAt,
        cm.CreatedBy
      FROM ContinuumMark cm
    `

    if (homeGuid) {
      queryText += `
        INNER JOIN MarkSubject ms ON cm.MarkID = ms.MarkID
      `
    }

    queryText += `
      WHERE ${whereConditions.join(' AND ')}
      ORDER BY cm.MarkDate DESC
    `

    const visits = await query(queryText, params)

    const duration = Date.now() - startTime
    console.log(`✅ [RADIUS-API] Retrieved ${visits.length} visits in ${duration}ms`)

    // Parse JSON payload if present
    const processedVisits = visits.map((visit: any) => ({
      ...visit,
      JsonPayload: visit.JsonPayload ? JSON.parse(visit.JsonPayload) : null
    }))

    return NextResponse.json({
      success: true,
      visits: processedVisits,
      count: processedVisits.length,
      timestamp: new Date().toISOString(),
      duration_ms: duration
    })
  } catch (error) {
    const duration = Date.now() - startTime
    console.error("❌ [RADIUS-API] Error fetching visits:", error)
    return NextResponse.json({
      success: false,
      visits: [],
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString(),
      duration_ms: duration
    }, { status: 500 })
  }
}

