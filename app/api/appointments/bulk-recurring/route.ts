/**
 * Bulk Recurring Appointments API
 * Creates multiple appointments based on a recurring pattern
 * 
 * Example: "First Monday of every month at 4pm" for all of 2026
 */

import { NextResponse, type NextRequest } from "next/server"
import { query } from "@refugehouse/shared-core/db"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"
export const maxDuration = 60

/**
 * Calculate dates for recurring appointments
 * 
 * @param pattern - Recurring pattern like "first_monday", "second_tuesday", "last_friday", etc.
 * @param startYear - Year to start generating appointments (e.g., 2026)
 * @param endYear - Year to end generating appointments (default: same as startYear)
 * @param time - Time in HH:mm format (e.g., "16:00")
 * @returns Array of date strings in YYYY-MM-DDTHH:mm:ss format
 */
function calculateRecurringDates(
  pattern: string,
  startYear: number,
  endYear: number = startYear,
  time: string = "09:00"
): string[] {
  const dates: string[] = []
  const [hour, minute] = time.split(':').map(Number)

  // Parse pattern: "first_monday", "second_tuesday", "last_friday", etc.
  const patternMatch = pattern.match(/^(first|second|third|fourth|last)_(monday|tuesday|wednesday|thursday|friday|saturday|sunday)$/i)
  
  if (!patternMatch) {
    throw new Error(`Invalid recurring pattern: ${pattern}. Expected format: "first_monday", "second_tuesday", "last_friday", etc.`)
  }

  const [, occurrence, dayName] = patternMatch
  const dayIndex = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'].indexOf(dayName.toLowerCase())

  for (let year = startYear; year <= endYear; year++) {
    for (let month = 0; month < 12; month++) {
      let date: Date | null = null

      if (occurrence.toLowerCase() === 'last') {
        // Find last occurrence of the day in the month
        const lastDay = new Date(year, month + 1, 0) // Last day of month
        let day = lastDay.getDate()
        while (day > 0) {
          const testDate = new Date(year, month, day)
          if (testDate.getDay() === dayIndex) {
            date = testDate
            break
          }
          day--
        }
      } else {
        // Find first, second, third, or fourth occurrence
        const occurrenceIndex = ['first', 'second', 'third', 'fourth'].indexOf(occurrence.toLowerCase())
        let found = 0
        let day = 1
        const lastDay = new Date(year, month + 1, 0).getDate()
        
        while (day <= lastDay) {
          const testDate = new Date(year, month, day)
          if (testDate.getDay() === dayIndex) {
            if (found === occurrenceIndex) {
              date = testDate
              break
            }
            found++
          }
          day++
        }
      }

      if (date) {
        date.setHours(hour, minute, 0, 0)
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`
        dates.push(dateStr)
      }
    }
  }

  return dates.sort()
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      title,
      description,
      appointmentType = "home_visit",
      homeXref,
      locationAddress,
      locationNotes,
      assignedToUserId = null, // Optional - can be null for unassigned
      assignedToName = null,   // Optional - can be null for unassigned
      assignedToRole = null,
      priority = "normal",
      preparationNotes,
      createdByName,
      // Recurring pattern fields
      recurringPattern,        // e.g., "first_monday", "second_tuesday", "last_friday"
      startYear,               // e.g., 2026
      endYear,                 // e.g., 2026 (defaults to startYear)
      time,                    // e.g., "16:00" (4pm)
      durationMinutes = 60,  // Default 60 minutes
    } = body

    // Validation
    if (!title || !recurringPattern || !startYear || !time) {
      return NextResponse.json(
        { error: "Missing required fields: title, recurringPattern, startYear, time" },
        { status: 400 },
      )
    }

    if (homeXref) {
      const homeExists = await query("SELECT COUNT(*) as count FROM SyncActiveHomes WHERE Xref = @param0", [homeXref])
      if (homeExists[0].count === 0) {
        return NextResponse.json({ error: "Selected home does not exist" }, { status: 400 })
      }
    }

    // Calculate all recurring dates
    const dates = calculateRecurringDates(
      recurringPattern,
      startYear,
      endYear || startYear,
      time
    )

    if (dates.length === 0) {
      return NextResponse.json(
        { error: "No dates generated for the given pattern" },
        { status: 400 },
      )
    }

    console.log(`📅 [API] Creating ${dates.length} recurring appointments for pattern: ${recurringPattern}`)

    // Create appointments for each date
    const createdAppointments: string[] = []
    const errors: string[] = []

    for (const dateStr of dates) {
      try {
        // Calculate end datetime
        const startDate = new Date(dateStr.replace('T', ' '))
        const endDate = new Date(startDate.getTime() + durationMinutes * 60 * 1000)
        const endStr = `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}T${String(endDate.getHours()).padStart(2, '0')}:${String(endDate.getMinutes()).padStart(2, '0')}:00`

        const result = await query(
          `
          INSERT INTO appointments (
            title,
            description,
            appointment_type,
            start_datetime,
            end_datetime,
            status,
            home_xref,
            location_address,
            location_notes,
            assigned_to_user_id,
            assigned_to_name,
            assigned_to_role,
            created_by_user_id,
            created_by_name,
            priority,
            is_recurring,
            recurring_pattern,
            preparation_notes,
            created_at,
            updated_at
          )
          OUTPUT INSERTED.appointment_id, INSERTED.created_at
          VALUES (
            @param0, @param1, @param2, @param3, @param4, 'scheduled',
            @param5, @param6, @param7, @param8, @param9,
            @param10, @param11, @param12, @param13, @param14, @param15,
            @param16, GETUTCDATE(), GETUTCDATE()
          )
        `,
          [
            title,
            description,
            appointmentType,
            dateStr,
            endStr,
            homeXref,
            locationAddress,
            locationNotes,
            assignedToUserId,
            assignedToName,
            assignedToRole,
            "temp-user-id", // Temporary placeholder
            createdByName || "System User",
            priority,
            1, // is_recurring = true
            recurringPattern,
            preparationNotes,
          ],
        )

        createdAppointments.push(result[0].appointment_id)
      } catch (error: any) {
        errors.push(`Failed to create appointment for ${dateStr}: ${error.message}`)
        console.error(`❌ [API] Error creating appointment for ${dateStr}:`, error)
      }
    }

    console.log(`✅ [API] Created ${createdAppointments.length} of ${dates.length} appointments`)

    return NextResponse.json({
      success: true,
      created: createdAppointments.length,
      total: dates.length,
      appointmentIds: createdAppointments,
      errors: errors.length > 0 ? errors : undefined,
      message: `Created ${createdAppointments.length} recurring appointments`,
    }, { status: 201 })

  } catch (error) {
    console.error("❌ [API] Error creating bulk recurring appointments:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create bulk recurring appointments",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

