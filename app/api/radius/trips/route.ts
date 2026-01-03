/**
 * Trips API Hub
 * Route: admin.refugehouse.app/api/radius/trips
 * 
 * Creates trip records linked to ContinuumMark visits
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
      tripDate,
      staffClerkId,
      staffRadiusGuid,
      staffEmail,
      staffName,
      tripPurpose,
      originType,
      originAddress,
      destinationType,
      destinationAddress,
      destinationFosterHomeGuid,
      milesEstimated,
      milesActual,
      costCenterUnit,
      relatedMarkId
    } = body

    // Validate required fields
    if (!tripDate || !staffClerkId || !staffEmail || !staffName || !tripPurpose || !originType || !destinationType || !costCenterUnit) {
      return NextResponse.json({
        success: false,
        error: "Missing required fields: tripDate, staffClerkId, staffEmail, staffName, tripPurpose, originType, destinationType, costCenterUnit"
      }, { status: 400 })
    }

    const result = await query(
      `INSERT INTO Trips (
         TripDate, StaffClerkId, StaffRadiusGuid, StaffEmail, StaffName,
         TripPurpose, OriginType, OriginAddress,
         DestinationType, DestinationAddress, DestinationFosterHomeGuid,
         MilesEstimated, MilesActual, CostCenterUnit, RelatedMarkID, TripStatus, IsDeleted
       )
       OUTPUT INSERTED.TripID
       VALUES (
         @param0, @param1, @param2, @param3, @param4,
         @param5, @param6, @param7,
         @param8, @param9, @param10,
         @param11, @param12, @param13, @param14, 'completed', 0
       )`,
      [
        tripDate, staffClerkId, staffRadiusGuid || null, staffEmail, staffName,
        tripPurpose, originType, originAddress || null,
        destinationType, destinationAddress || null, destinationFosterHomeGuid || null,
        milesEstimated || null, milesActual || null, costCenterUnit, relatedMarkId || null
      ]
    )

    const tripId = result[0].TripID
    const duration = Date.now() - startTime

    console.log(`✅ [RADIUS-API] Created trip ${tripId} in ${duration}ms`)

    return NextResponse.json({
      success: true,
      tripId,
      message: "Trip created successfully",
      timestamp: new Date().toISOString(),
      duration_ms: duration
    }, { status: 201 })
  } catch (error) {
    const duration = Date.now() - startTime
    console.error("❌ [RADIUS-API] Error creating trip:", error)
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
    const staffGuid = searchParams.get('staffGuid')
    const staffClerkId = searchParams.get('staffClerkId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const relatedMarkId = searchParams.get('relatedMarkId')

    // Build dynamic query
    let whereConditions = ["IsDeleted = 0"]
    const params: any[] = []
    let paramIndex = 0

    if (staffGuid) {
      whereConditions.push(`StaffRadiusGuid = @param${paramIndex}`)
      params.push(staffGuid)
      paramIndex++
    }

    if (staffClerkId) {
      whereConditions.push(`StaffClerkId = @param${paramIndex}`)
      params.push(staffClerkId)
      paramIndex++
    }

    if (startDate) {
      whereConditions.push(`TripDate >= @param${paramIndex}`)
      params.push(startDate)
      paramIndex++
    }

    if (endDate) {
      whereConditions.push(`TripDate <= @param${paramIndex}`)
      params.push(endDate)
      paramIndex++
    }

    if (relatedMarkId) {
      whereConditions.push(`RelatedMarkID = @param${paramIndex}`)
      params.push(relatedMarkId)
      paramIndex++
    }

    const trips = await query(
      `SELECT * FROM Trips
       WHERE ${whereConditions.join(' AND ')}
       ORDER BY TripDate DESC`,
      params
    )

    const duration = Date.now() - startTime
    console.log(`✅ [RADIUS-API] Retrieved ${trips.length} trips in ${duration}ms`)

    return NextResponse.json({
      success: true,
      trips,
      count: trips.length,
      timestamp: new Date().toISOString(),
      duration_ms: duration
    })
  } catch (error) {
    const duration = Date.now() - startTime
    console.error("❌ [RADIUS-API] Error fetching trips:", error)
    return NextResponse.json({
      success: false,
      trips: [],
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString(),
      duration_ms: duration
    }, { status: 500 })
  }
}

