import { NextRequest, NextResponse } from "next/server"
import { shouldUseRadiusApiClient, throwIfDirectDbNotAllowed } from "@/lib/microservice-config"
import { radiusApiClient } from "@refugehouse/radius-api-client"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

// GET - Fetch on-call schedules
export async function GET(request: NextRequest) {
  try {
    console.log("📅 [API] Fetching on-call schedules")

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")
    const userId = searchParams.get("userId")
    const onCallType = searchParams.get("type")
    const includeDeleted = searchParams.get("includeDeleted") === "true"
    
    console.log("📅 [API] Query parameters:", { startDate, endDate, userId, onCallType, includeDeleted })

    const useApiClient = shouldUseRadiusApiClient()

    // NO DB FALLBACK - must use API client
    if (!useApiClient) {
      throwIfDirectDbNotAllowed("on-call GET endpoint")
    }

    // Use API client to get on-call schedules
    console.log("✅ [ON-CALL] Using API client to get on-call schedules")
    const schedules = await radiusApiClient.getOnCallSchedules({
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      userId: userId || undefined,
      type: onCallType || undefined,
      includeDeleted,
    })

    console.log(`✅ [API] Retrieved ${schedules.length} on-call schedules`)

    return NextResponse.json({
      success: true,
      schedules,
      count: schedules.length,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("❌ [API] Error fetching on-call schedules:", error)
    console.error("❌ [API] Error details:", {
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined,
    })
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch on-call schedules",
        details: error instanceof Error ? error.message : "Unknown error",
        errorType: error instanceof Error ? error.name : "Unknown",
        stack: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : undefined) : undefined,
      },
      { status: 500 },
    )
  }
}

// POST - Create new on-call schedule assignment
export async function POST(request: NextRequest) {
  try {
    console.log("📅 [API] Creating new on-call schedule")

    // Note: Clerk middleware is not active for API routes
    // Authentication is handled at component level
    // If we need the current user, we'll get it from the request body

    const body = await request.json()
    console.log("📅 [API] Request body:", JSON.stringify(body, null, 2))
    
    const { 
      userId, 
      appUserId: providedAppUserId,
      userName, 
      userEmail, 
      userPhone,
      phoneFromDatabase,
      startDatetime, 
      endDatetime, 
      notes, 
      priorityLevel,
      onCallType,
      onCallCategory,
      roleRequired,
      department,
      region,
      escalationLevel,
      createdByUserId,
      createdByName
    } = body
    
    console.log("📅 [API] Extracted values:", {
      userId,
      userName,
      startDatetime,
      endDatetime,
      onCallType,
      roleRequired,
      department,
      escalationLevel
    })

    // Validation
    if (!userName || !startDatetime || !endDatetime) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: userName, startDatetime, endDatetime",
        },
        { status: 400 },
      )
    }

    // Validate date range
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

    // Use provided appUserId if available, otherwise convert from userId
    let appUserId: string | null = providedAppUserId || null
    
    // If not provided, try to convert from userId
    if (!appUserId && userId) {
      // Check if userId is already a GUID or if it's a Clerk ID
      const isGuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)
      
      if (isGuid) {
        appUserId = userId
      } else {
        // It's a Clerk ID - API Hub will handle the conversion
        // Just pass the Clerk ID, API Hub will convert it
      }
    }

    // NO DIRECT DB ACCESS - overlap validation and phone updates are handled by API Hub
    // The API Hub will:
    // 1. Convert Clerk ID to app_users.id if needed
    // 2. Check for overlapping assignments (returns 409 if conflict)
    // 3. Update app_users phone if provided

    const useApiClient = shouldUseRadiusApiClient()

    // NO DB FALLBACK - must use API client
    if (!useApiClient) {
      throwIfDirectDbNotAllowed("on-call POST endpoint")
    }

    // Use API client to create on-call schedule
    console.log("✅ [ON-CALL] Using API client to create on-call schedule")
    const scheduleData = {
      userId,
      appUserId,
      userName,
      userEmail,
      userPhone,
      phoneFromDatabase,
      startDatetime,
      endDatetime,
      notes,
      priorityLevel,
      onCallType,
      onCallCategory,
      roleRequired,
      department,
      region,
      escalationLevel,
      createdByUserId,
      createdByName,
    }

    const apiResult = await radiusApiClient.createOnCallSchedule(scheduleData)
    const newScheduleId = apiResult.id

    console.log(`✅ [API] Created on-call schedule: ${newScheduleId}`)

    return NextResponse.json({
      success: true,
      scheduleId: newScheduleId,
      message: "On-call schedule created successfully",
    })
  } catch (error) {
    console.error("❌ [API] Error creating on-call schedule:", error)
    console.error("❌ [API] Error details:", {
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined,
    })
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create on-call schedule",
        details: error instanceof Error ? error.message : "Unknown error",
        errorType: error instanceof Error ? error.name : "Unknown",
        stack: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : undefined) : undefined,
      },
      { status: 500 },
    )
  }
}

