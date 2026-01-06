import { NextRequest, NextResponse } from "next/server"
import { shouldUseRadiusApiClient, throwIfDirectDbNotAllowed } from "@/lib/microservice-config"
import { radiusApiClient } from "@refugehouse/radius-api-client"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

// GET - Fetch specific on-call schedule by ID
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    console.log(`📅 [API] Fetching on-call schedule: ${id}`)

    const useApiClient = shouldUseRadiusApiClient()

    // NO DB FALLBACK - must use API client
    if (!useApiClient) {
      throwIfDirectDbNotAllowed("on-call/[id] GET endpoint")
    }

    // Use API client to get on-call schedule
    console.log("✅ [ON-CALL] Using API client to get on-call schedule")
    const scheduleData = await radiusApiClient.getOnCallSchedule(id)
    const schedule = [scheduleData]

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

    // NO DIRECT DB ACCESS - overlap validation is handled by API Hub
    // The API Hub will return 409 if there's an overlap conflict

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

    const useApiClient = shouldUseRadiusApiClient()

    // NO DB FALLBACK - must use API client
    if (!useApiClient) {
      throwIfDirectDbNotAllowed("on-call/[id] PUT endpoint")
    }

    // Use API client to update on-call schedule
    console.log("✅ [ON-CALL] Using API client to update on-call schedule")
    const updateData: any = {}
    if (userId !== undefined) updateData.userId = userId
    if (userName !== undefined) updateData.userName = userName
    if (userEmail !== undefined) updateData.userEmail = userEmail
    if (userPhone !== undefined) updateData.userPhone = userPhone
    if (startDatetime !== undefined) updateData.startDatetime = startDatetime
    if (endDatetime !== undefined) updateData.endDatetime = endDatetime
    if (notes !== undefined) updateData.notes = notes
    if (priorityLevel !== undefined) updateData.priorityLevel = priorityLevel
    if (isActive !== undefined) updateData.isActive = isActive
    if (onCallType !== undefined) updateData.onCallType = onCallType
    if (onCallCategory !== undefined) updateData.onCallCategory = onCallCategory
    if (roleRequired !== undefined) updateData.roleRequired = roleRequired
    if (department !== undefined) updateData.department = department
    if (region !== undefined) updateData.region = region
    if (escalationLevel !== undefined) updateData.escalationLevel = escalationLevel
    updateData.updatedByUserId = updatedByUserId || "system"
    updateData.updatedByName = updatedByName || "System"

    await radiusApiClient.updateOnCallSchedule(id, updateData)

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

    const useApiClient = shouldUseRadiusApiClient()
    const body = await request.json().catch(() => ({}))
    const { deletedByUserId, deletedByName } = body

    // NO DB FALLBACK - must use API client
    if (!useApiClient) {
      throwIfDirectDbNotAllowed("on-call/[id] DELETE endpoint")
    }

    // Use API client to delete on-call schedule
    console.log("✅ [ON-CALL] Using API client to delete on-call schedule")
    await radiusApiClient.deleteOnCallSchedule(id, deletedByUserId, deletedByName)

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

