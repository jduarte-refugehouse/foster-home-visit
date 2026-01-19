import { NextRequest, NextResponse } from "next/server"
import { validateApiKey } from "@/lib/api-auth"
import { query } from "@refugehouse/shared-core/db"
import { calculateDrivingDistance } from "@refugehouse/shared-core/route-calculator"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"
export const maxDuration = 60

/**
 * PATCH /api/radius/travel-legs/[legId]
 * 
 * Complete a travel leg (add end point and calculate mileage)
 * Requires API key authentication via x-api-key header
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { legId: string } }
) {
  const startTime = Date.now()

  try {
    // 1. Validate API key
    const apiKeyRaw = request.headers.get("x-api-key")
    const apiKey = apiKeyRaw?.trim() || null
    const validation = await validateApiKey(apiKey)

    if (!validation.valid) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
          details: validation.error || "Invalid API key",
        },
        { status: 401 }
      )
    }

    const legId = params.legId
    const body = await request.json()
    const {
      end_latitude,
      end_longitude,
      end_timestamp,
      end_location_name,
      end_location_address,
      end_location_type,
      appointment_id_to,
      is_final_leg,
      manual_mileage, // Optional: user override for calculated mileage
      manual_notes, // Optional: notes about manual entry/override
      updated_by_user_id,
    } = body

    // 2. Validation
    if (end_latitude === undefined || end_longitude === undefined || !end_timestamp) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: end_latitude, end_longitude, end_timestamp",
        },
        { status: 400 }
      )
    }

    // 3. Get existing leg with journey info
    const existingLegs = await query(
      `SELECT leg_id, journey_id, staff_user_id, staff_name, start_latitude, start_longitude, 
              start_timestamp, start_location_name, start_location_address, start_location_type,
              leg_status, appointment_id_from, appointment_id_to, travel_purpose, vehicle_type
       FROM travel_legs
       WHERE leg_id = @param0 AND is_deleted = 0`,
      [legId]
    )

    if (existingLegs.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Travel leg not found",
        },
        { status: 404 }
      )
    }

    const leg = existingLegs[0]

    if (leg.leg_status !== "in_progress") {
      return NextResponse.json(
        {
          success: false,
          error: `Leg is already ${leg.leg_status}. Cannot complete.`,
        },
        { status: 400 }
      )
    }

    // 4. Calculate mileage
    let calculatedMileage = 0.00
    let estimatedToll: number | null = null
    let durationMinutes: number | null = null

    if (leg.start_latitude && leg.start_longitude) {
      try {
        const routeData = await calculateDrivingDistance(
          leg.start_latitude,
          leg.start_longitude,
          end_latitude,
          end_longitude
        )

        if (routeData) {
          calculatedMileage = routeData.distance
          estimatedToll = routeData.estimatedTollCost
        }
      } catch (routeError) {
        console.error("❌ [RADIUS-API] Error calculating route:", routeError)
        // Continue with 0 mileage if calculation fails
      }
    }

    // 5. Calculate duration
    try {
      const startTime = new Date(leg.start_timestamp).getTime()
      const endTime = new Date(end_timestamp).getTime()
      durationMinutes = Math.round((endTime - startTime) / (1000 * 60))
    } catch (durationError) {
      console.error("❌ [RADIUS-API] Error calculating duration:", durationError)
    }

    // 6. Update leg
    // Use manual_mileage if provided (user override), otherwise use calculated_mileage
    const finalMileage = manual_mileage !== undefined && manual_mileage !== null ? manual_mileage : calculatedMileage
    
    await query(
      `UPDATE travel_legs
       SET end_latitude = @param1,
           end_longitude = @param2,
           end_timestamp = @param3,
           end_location_name = @param4,
           end_location_address = @param5,
           end_location_type = @param6,
           appointment_id_to = @param7,
           calculated_mileage = @param8,
           manual_mileage = @param9,
           manual_notes = @param10,
           estimated_toll_cost = @param11,
           duration_minutes = @param12,
           is_final_leg = @param13,
           leg_status = 'completed',
           updated_at = GETUTCDATE(),
           updated_by_user_id = @param14
       WHERE leg_id = @param0`,
      [
        legId,
        end_latitude,
        end_longitude,
        end_timestamp,
        end_location_name || null,
        end_location_address || null,
        end_location_type || null,
        appointment_id_to || null,
        calculatedMileage, // Always store calculated value
        manual_mileage || null, // Store manual override if provided
        manual_notes || null, // Store notes if provided
        estimatedToll,
        durationMinutes,
        is_final_leg || false,
        updated_by_user_id || null,
      ]
    )

    // 7. If this is a return leg, update appointment return_mileage
    const returnAppointmentId = leg.appointment_id_from
    if (returnAppointmentId && !appointment_id_to && is_final_leg) {
      try {
        await query(
          `UPDATE appointments 
           SET return_latitude = @param1,
               return_longitude = @param2,
               return_timestamp = @param3,
               return_mileage = @param4,
               updated_at = GETUTCDATE()
           WHERE appointment_id = @param0 AND is_deleted = 0`,
          [
            returnAppointmentId,
            end_latitude,
            end_longitude,
            end_timestamp,
            calculatedMileage,
          ]
        )
      } catch (updateError: any) {
        // If return columns don't exist, log a warning but don't fail
        if (updateError.message?.includes("Invalid column name")) {
          console.warn("⚠️ [RADIUS-API] Return travel columns not found in appointments table")
        } else {
          console.error("⚠️ [RADIUS-API] Failed to update appointment return mileage (non-fatal):", updateError)
        }
      }
    }

    // 8. If this is the final leg, roll up totals into trips table
    if (leg.journey_id && is_final_leg) {
      try {
        // Roll up totals from all completed legs in this journey
        // Use manual_mileage if available (user override), otherwise use calculated_mileage
        const totalsResult = await query(
          `SELECT 
            SUM(COALESCE(manual_mileage, calculated_mileage, 0)) as total_mileage,
            SUM(COALESCE(duration_minutes, 0)) as total_duration_minutes,
            SUM(COALESCE(estimated_toll_cost, 0)) as total_tolls_estimated,
            SUM(COALESCE(actual_toll_cost, 0)) as total_tolls_actual,
            MIN(start_timestamp) as journey_start,
            MAX(end_timestamp) as journey_end,
            MAX(CASE WHEN is_manual_entry = 1 THEN 1 ELSE 0 END) as has_manual_entry,
            MAX(CASE WHEN is_backdated = 1 THEN 1 ELSE 0 END) as has_backdated
          FROM travel_legs
          WHERE journey_id = @param0 AND is_deleted = 0 AND leg_status = 'completed'`,
          [leg.journey_id]
        )

        if (totalsResult.length > 0 && totalsResult[0].journey_end) {
          const totals = totalsResult[0]
          
          // Update travel_journeys table with rolled-up totals
          await query(
            `UPDATE travel_journeys
             SET end_timestamp = @param1,
                 total_mileage = @param2,
                 total_duration_minutes = @param3,
                 total_tolls_estimated = @param4,
                 total_tolls_actual = @param5,
                 is_manual_entry = @param6,
                 is_backdated = @param7,
                 trip_status = 'completed',
                 updated_at = GETUTCDATE(),
                 updated_by_user_id = @param8
             WHERE journey_id = @param0`,
            [
              leg.journey_id,
              totals.journey_end,
              totals.total_mileage || 0,
              totals.total_duration_minutes || 0,
              totals.total_tolls_estimated || 0,
              totals.total_tolls_actual || 0,
              totals.has_manual_entry || 0,
              totals.has_backdated || 0,
              updated_by_user_id || leg.staff_user_id,
            ]
          )
          console.log(`✅ [RADIUS-API] Updated travel_journeys table for journey ${leg.journey_id} with rolled-up totals`)
        }
      } catch (tripsError: any) {
        // If travel_journeys table doesn't exist yet, log warning but continue
        if (tripsError.message?.includes("Invalid object name") || tripsError.message?.includes("travel_journeys")) {
          console.warn("⚠️ [RADIUS-API] travel_journeys table not found - please run create-trips-table.sql migration")
        } else {
          console.error("❌ [RADIUS-API] Error updating trips table (non-fatal):", tripsError)
        }
        // Continue with Trips table creation/update
      }
    }

    // 9. Check if journey is complete and create/update Trips record for expense reporting
    let tripId: string | null = null
    if (leg.journey_id && is_final_leg) {
      try {
        // Check if all legs in journey are completed
        const journeyLegs = await query(
          `SELECT leg_id, leg_status, leg_sequence, is_final_leg
           FROM travel_legs
           WHERE journey_id = @param0 AND is_deleted = 0
           ORDER BY leg_sequence`,
          [leg.journey_id]
        )

        const allCompleted = journeyLegs.every((l: any) => l.leg_status === 'completed')
        
        if (allCompleted && journeyLegs.length > 0) {
          // Aggregate all legs for the trip
          const allLegsData = await query(
            `SELECT 
              staff_user_id, staff_name, travel_purpose, vehicle_type,
              MIN(start_timestamp) as journey_start,
              MAX(end_timestamp) as journey_end,
              SUM(COALESCE(calculated_mileage, manual_mileage, 0)) as total_mileage,
              SUM(COALESCE(estimated_toll_cost, 0)) as total_toll_cost,
              SUM(COALESCE(duration_minutes, 0)) as total_duration,
              MIN(start_location_name) as origin_name,
              MIN(start_location_address) as origin_address,
              MIN(start_location_type) as origin_type,
              MIN(start_latitude) as origin_lat,
              MIN(start_longitude) as origin_lng,
              MAX(end_location_name) as destination_name,
              MAX(end_location_address) as destination_address,
              MAX(end_location_type) as destination_type,
              MAX(end_latitude) as destination_lat,
              MAX(end_longitude) as destination_lng,
              MAX(CASE WHEN appointment_id_to IS NOT NULL THEN appointment_id_to ELSE appointment_id_from END) as related_appointment_id
            FROM travel_legs
            WHERE journey_id = @param0 AND is_deleted = 0 AND leg_status = 'completed'
            GROUP BY staff_user_id, staff_name, travel_purpose, vehicle_type`,
            [leg.journey_id]
          )

          if (allLegsData.length > 0) {
            const journeyData = allLegsData[0]
            
            // Get staff identity for cost allocation
            const staffIdentity = await query(
              `SELECT 
                au.id as clerk_id,
                au.email,
                au.full_name,
                au.radius_person_guid,
                CASE WHEN sru.DAL_personID IS NOT NULL THEN 'DAL' ELSE 'SAN' END as unit
              FROM app_users au
              LEFT JOIN SyncRadiusUsers sru ON au.radius_person_guid = sru.guid
              WHERE (au.id = @param0 OR au.email = @param0)
                AND au.user_type = 'staff'`,
              [journeyData.staff_user_id]
            )

            if (staffIdentity.length > 0) {
              const identity = staffIdentity[0]
              const costCenterUnit = identity.unit || 'DAL' // Default to DAL if unit not found
              
              // Get related ContinuumMark if there's an appointment
              let relatedMarkId: string | null = null
              if (journeyData.related_appointment_id) {
                const markResult = await query(
                  `SELECT TOP 1 MarkID
                   FROM ContinuumMark
                   WHERE JsonPayload LIKE @param0
                     AND SourceSystem = 'VisitService'
                     AND IsDeleted = 0
                   ORDER BY MarkDate DESC`,
                  [`%${journeyData.related_appointment_id}%`]
                )
                if (markResult.length > 0) {
                  relatedMarkId = markResult[0].MarkID
                }
              }

              // Check if Trips record already exists for this journey
              const existingTrip = await query(
                `SELECT TripID FROM Trips 
                 WHERE StaffClerkId = @param0 
                   AND TripDate = CAST(@param1 AS DATE)
                   AND TripPurpose = @param2
                   AND IsDeleted = 0`,
                [
                  identity.clerk_id,
                  new Date(journeyData.journey_start).toISOString().split('T')[0],
                  journeyData.travel_purpose || 'Home Visit'
                ]
              )

              const tripDate = new Date(journeyData.journey_start).toISOString().split('T')[0]
              const totalMileage = parseFloat(journeyData.total_mileage) || 0
              const totalToll = parseFloat(journeyData.total_toll_cost) || 0
              const totalDuration = parseInt(journeyData.total_duration) || 0

              if (existingTrip.length > 0) {
                // Update existing trip
                await query(
                  `UPDATE Trips
                   SET MilesActual = @param1,
                       ActualTollCost = @param2,
                       DurationMinutes = @param3,
                       UpdatedAt = GETDATE(),
                       UpdatedBy = @param4
                   WHERE TripID = @param0`,
                  [
                    existingTrip[0].TripID,
                    totalMileage,
                    totalToll,
                    totalDuration,
                    identity.clerk_id
                  ]
                )
                tripId = existingTrip[0].TripID
                console.log(`✅ [RADIUS-API] Updated Trips record ${tripId} for completed journey ${leg.journey_id}`)
              } else {
                // Create new trip
                const tripResult = await query(
                  `INSERT INTO Trips (
                    TripDate, StaffClerkId, StaffRadiusGuid, StaffEmail, StaffName,
                    TripPurpose, OriginType, OriginAddress, OriginLatitude, OriginLongitude,
                    DestinationType, DestinationAddress, DestinationLatitude, DestinationLongitude,
                    MilesEstimated, MilesActual, EstimatedTollCost, ActualTollCost,
                    DurationMinutes, CostCenterUnit, RelatedMarkID, TripStatus, IsReimbursable, IsDeleted
                  )
                  OUTPUT INSERTED.TripID
                  VALUES (
                    @param0, @param1, @param2, @param3, @param4,
                    @param5, @param6, @param7, @param8, @param9,
                    @param10, @param11, @param12, @param13,
                    @param14, @param15, @param16, @param17,
                    @param18, @param19, @param20, 'completed', 1, 0
                  )`,
                  [
                    tripDate,
                    identity.clerk_id,
                    identity.radius_person_guid || null,
                    identity.email || journeyData.staff_user_id,
                    identity.full_name || journeyData.staff_name || 'Unknown',
                    journeyData.travel_purpose || 'Home Visit',
                    journeyData.origin_type || 'office',
                    journeyData.origin_address || journeyData.origin_name || null,
                    journeyData.origin_lat || null,
                    journeyData.origin_lng || null,
                    journeyData.destination_type || 'foster_home',
                    journeyData.destination_address || journeyData.destination_name || null,
                    journeyData.destination_lat || null,
                    journeyData.destination_lng || null,
                    totalMileage, // MilesEstimated
                    totalMileage, // MilesActual
                    totalToll, // EstimatedTollCost
                    totalToll, // ActualTollCost
                    totalDuration,
                    costCenterUnit,
                    relatedMarkId
                  ]
                )
                tripId = tripResult[0].TripID
                console.log(`✅ [RADIUS-API] Created Trips record ${tripId} for completed journey ${leg.journey_id} (Cost Center: ${costCenterUnit})`)
              }
            } else {
              console.warn(`⚠️ [RADIUS-API] Could not find staff identity for ${journeyData.staff_user_id} - skipping Trips creation`)
            }
          }
        }
      } catch (tripError: any) {
        // Log error but don't fail the leg completion
        console.error("❌ [RADIUS-API] Error creating/updating Trips record (non-fatal):", tripError)
      }
    }

    const duration = Date.now() - startTime
    console.log(`✅ [RADIUS-API] Completed travel leg ${legId} in ${duration}ms`)

    return NextResponse.json({
      success: true,
      message: "Travel leg completed",
      calculated_mileage: calculatedMileage,
      estimated_toll_cost: estimatedToll,
      duration_minutes: durationMinutes,
      trip_id: tripId, // Include trip ID if created/updated
      timestamp: new Date().toISOString(),
      duration_ms: duration,
    })
  } catch (error) {
    const duration = Date.now() - startTime
    console.error("❌ [RADIUS-API] Error in travel-legs PATCH [legId]:", error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
        timestamp: new Date().toISOString(),
        duration_ms: duration,
      },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/radius/travel-legs/[legId]
 * 
 * Cancel a travel leg
 * Requires API key authentication via x-api-key header
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { legId: string } }
) {
  const startTime = Date.now()

  try {
    // 1. Validate API key
    const apiKeyRaw = request.headers.get("x-api-key")
    const apiKey = apiKeyRaw?.trim() || null
    const validation = await validateApiKey(apiKey)

    if (!validation.valid) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
          details: validation.error || "Invalid API key",
        },
        { status: 401 }
      )
    }

    const legId = params.legId
    const body = await request.json().catch(() => ({}))
    const { updated_by_user_id } = body

    // 2. Check if leg exists
    const existingLeg = await query(
      "SELECT leg_id FROM travel_legs WHERE leg_id = @param0 AND is_deleted = 0",
      [legId]
    )

    if (existingLeg.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Travel leg not found",
        },
        { status: 404 }
      )
    }

    // 3. Cancel leg
    await query(
      `UPDATE travel_legs
       SET leg_status = 'cancelled',
           updated_at = GETUTCDATE(),
           updated_by_user_id = @param1
       WHERE leg_id = @param0 AND is_deleted = 0`,
      [legId, updated_by_user_id || null]
    )

    const duration = Date.now() - startTime
    console.log(`✅ [RADIUS-API] Cancelled travel leg ${legId} in ${duration}ms`)

    return NextResponse.json({
      success: true,
      message: "Travel leg cancelled",
      timestamp: new Date().toISOString(),
      duration_ms: duration,
    })
  } catch (error) {
    const duration = Date.now() - startTime
    console.error("❌ [RADIUS-API] Error in travel-legs DELETE [legId]:", error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
        timestamp: new Date().toISOString(),
        duration_ms: duration,
      },
      { status: 500 }
    )
  }
}

