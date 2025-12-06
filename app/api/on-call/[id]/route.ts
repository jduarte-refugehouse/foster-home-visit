import { NextRequest, NextResponse } from "next/server"
import { query } from "@refugehouse/shared-core/db"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

// GET - Fetch specific on-call schedule by ID
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    console.log(`📅 [API] Fetching on-call schedule: ${id}`)

    const schedule = await query(
      `
      SELECT 
        ocs.id,
        ocs.user_id,
        ocs.user_name,
        ocs.user_email,
        ocs.user_phone,
        ocs.start_datetime,
        ocs.end_datetime,
        ocs.duration_hours,
        ocs.on_call_type,
        ocs.on_call_category,
        ocs.role_required,
        ocs.department,
        ocs.region,
        ocs.escalation_level,
        ocs.is_active,
        ocs.notes,
        ocs.priority_level,
        ocs.created_by_name,
        ocs.created_at,
        ocs.updated_at,
        ocs.updated_by_name,
        CASE 
          WHEN GETDATE() BETWEEN ocs.start_datetime AND ocs.end_datetime 
          THEN 1 
          ELSE 0 
        END as is_currently_active
      FROM on_call_schedule ocs
      WHERE ocs.id = @param0 AND ocs.is_deleted = 0
    `,
      [id],
    )

    if (schedule.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "On-call schedule not found",
        },
        { status: 404 },
      )
    }

    return NextResponse.json({
      success: true,
      schedule: schedule[0],
    })
  } catch (error) {
    console.error("❌ [API] Error fetching on-call schedule:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch on-call schedule",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

// PUT - Update on-call schedule
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    console.log(`📅 [API] Updating on-call schedule: ${id}`)

    // Note: Clerk middleware is not active for API routes
    // Authentication is handled at component level

    const body = await request.json()
    const { 
      userId, 
      userName, 
      userEmail, 
      userPhone, 
      startDatetime, 
      endDatetime, 
      notes, 
      priorityLevel, 
      isActive,
      onCallType,
      onCallCategory,
      roleRequired,
      department,
      region,
      escalationLevel,
      updatedByUserId,
      updatedByName
    } = body

    // Check if schedule exists
    const existing = await query(
      `SELECT id FROM on_call_schedule WHERE id = @param0 AND is_deleted = 0`,
      [id],
    )

    if (existing.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "On-call schedule not found",
        },
        { status: 404 },
      )
    }

    // Validate date range if provided
    if (startDatetime && endDatetime) {
      const start = new Date(startDatetime)
      const end = new Date(endDatetime)
      if (end <= start) {
        return NextResponse.json(
          {
            success: false,
            error: "End datetime must be after start datetime",
          },
          { status: 400 },
        )
      }
    }

    // Check for overlapping assignments if dates are being changed
    // Note: Exact boundary times (one ends when another starts) are NOT overlaps
    if ((startDatetime || endDatetime) && userId) {
      const overlaps = await query(
        `
        SELECT COUNT(*) as overlap_count
        FROM on_call_schedule
        WHERE user_id = @param0
          AND id != @param1
          AND is_active = 1
          AND is_deleted = 0
          AND (
            (start_datetime < @param3 AND end_datetime > @param2)
          )
      `,
        [userId, id, startDatetime, endDatetime],
      )

      if (overlaps[0].overlap_count > 0) {
        return NextResponse.json(
          {
            success: false,
            error: "This user already has an overlapping on-call assignment",
            code: "OVERLAP_CONFLICT",
          },
          { status: 409 },
        )
      }
    }

    // Build update query dynamically
    const updates: string[] = []
    const updateParams: any[] = []

    if (userId !== undefined) {
      updateParams.push(userId)
      updates.push(`user_id = @param${updateParams.length - 1}`)
    }
    if (userName !== undefined) {
      updateParams.push(userName)
      updates.push(`user_name = @param${updateParams.length - 1}`)
    }
    if (userEmail !== undefined) {
      updateParams.push(userEmail)
      updates.push(`user_email = @param${updateParams.length - 1}`)
    }
    if (userPhone !== undefined) {
      updateParams.push(userPhone)
      updates.push(`user_phone = @param${updateParams.length - 1}`)
    }
    if (startDatetime !== undefined) {
      updateParams.push(startDatetime)
      updates.push(`start_datetime = @param${updateParams.length - 1}`)
    }
    if (endDatetime !== undefined) {
      updateParams.push(endDatetime)
      updates.push(`end_datetime = @param${updateParams.length - 1}`)
    }
    if (notes !== undefined) {
      updateParams.push(notes)
      updates.push(`notes = @param${updateParams.length - 1}`)
    }
    if (priorityLevel !== undefined) {
      updateParams.push(priorityLevel)
      updates.push(`priority_level = @param${updateParams.length - 1}`)
    }
    if (isActive !== undefined) {
      updateParams.push(isActive ? 1 : 0)
      updates.push(`is_active = @param${updateParams.length - 1}`)
    }
    if (onCallType !== undefined) {
      updateParams.push(onCallType)
      updates.push(`on_call_type = @param${updateParams.length - 1}`)
    }
    if (onCallCategory !== undefined) {
      updateParams.push(onCallCategory)
      updates.push(`on_call_category = @param${updateParams.length - 1}`)
    }
    if (roleRequired !== undefined) {
      updateParams.push(roleRequired)
      updates.push(`role_required = @param${updateParams.length - 1}`)
    }
    if (department !== undefined) {
      updateParams.push(department)
      updates.push(`department = @param${updateParams.length - 1}`)
    }
    if (region !== undefined) {
      updateParams.push(region)
      updates.push(`region = @param${updateParams.length - 1}`)
    }
    if (escalationLevel !== undefined) {
      updateParams.push(escalationLevel)
      updates.push(`escalation_level = @param${updateParams.length - 1}`)
    }

    // Add updated_by fields
    updateParams.push(updatedByUserId || "system")
    updates.push(`updated_by_user_id = @param${updateParams.length - 1}`)

    updateParams.push(updatedByName || "System")
    updates.push(`updated_by_name = @param${updateParams.length - 1}`)

    updates.push(`updated_at = GETDATE()`)

    // Add the ID parameter last
    updateParams.push(id)

    await query(
      `
      UPDATE on_call_schedule
      SET ${updates.join(", ")}
      WHERE id = @param${updateParams.length - 1}
    `,
      updateParams,
    )

    console.log(`✅ [API] Updated on-call schedule: ${id}`)

    return NextResponse.json({
      success: true,
      message: "On-call schedule updated successfully",
    })
  } catch (error) {
    console.error("❌ [API] Error updating on-call schedule:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update on-call schedule",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

// DELETE - Soft delete on-call schedule
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id} = params
    console.log(`📅 [API] Deleting on-call schedule: ${id}`)

    // Note: Clerk middleware is not active for API routes
    // Authentication is handled at component level

    // Check if schedule exists
    const existing = await query(
      `SELECT id FROM on_call_schedule WHERE id = @param0 AND is_deleted = 0`,
      [id],
    )

    if (existing.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "On-call schedule not found",
        },
        { status: 404 },
      )
    }

    // Soft delete
    // Note: deleted_by_user_id would need to be passed from client if tracking needed
    await query(
      `
      UPDATE on_call_schedule
      SET 
        is_deleted = 1,
        deleted_at = GETDATE(),
        deleted_by_user_id = 'system'
      WHERE id = @param0
    `,
      [id],
    )

    console.log(`✅ [API] Deleted on-call schedule: ${id}`)

    return NextResponse.json({
      success: true,
      message: "On-call schedule deleted successfully",
    })
  } catch (error) {
    console.error("❌ [API] Error deleting on-call schedule:", error)
    console.error("Error details:", {
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined,
    })
    
    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete on-call schedule",
        details: error instanceof Error ? error.message : "Unknown error",
        errorType: error instanceof Error ? error.name : "Unknown",
        ...(process.env.NODE_ENV === "development" && {
          stack: error instanceof Error ? error.stack : undefined,
        }),
      },
      { status: 500 },
    )
  }
}

