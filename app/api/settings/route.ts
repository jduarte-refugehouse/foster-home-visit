import { NextRequest, NextResponse } from "next/server"
import { getClerkUserIdFromRequest } from "@refugehouse/shared-core/auth"
import { throwIfDirectDbNotAllowed } from "@/lib/microservice-config"
import { radiusApiClient } from "@refugehouse/radius-api-client"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

// GET - Fetch all settings or a specific setting
export async function GET(request: NextRequest) {
  // ENFORCE: Visit service MUST use API client - no direct DB access
  throwIfDirectDbNotAllowed("settings GET endpoint")
  
  try {
    const { searchParams } = new URL(request.url)
    const key = searchParams.get("key")

    try {
      if (key) {
        // Get specific setting
        console.log(`🔍 [API] Fetching setting '${key}' via API Hub`)
        const setting = await radiusApiClient.getSetting(key)
        if (!setting) {
          return NextResponse.json({ error: "Setting not found" }, { status: 404 })
        }
        console.log(`✅ [API] Setting '${key}' retrieved from API Hub`)
        return NextResponse.json({
          success: true,
          setting,
        })
      } else {
        // Get all settings
        console.log(`🔍 [API] Fetching all settings via API Hub`)
        const settings = await radiusApiClient.getAllSettings()
        console.log(`✅ [API] Retrieved ${settings.length} settings from API Hub`)
        return NextResponse.json({
          success: true,
          settings,
        })
      }
    } catch (apiError: any) {
      console.error(`❌ [API] Error fetching settings from API Hub:`, apiError)
      console.error(`❌ [API] API error details:`, {
        message: apiError?.message,
        status: apiError?.status,
        statusText: apiError?.statusText,
        response: apiError?.response,
        stack: apiError?.stack,
      })
      
      // Return detailed error - NO DATABASE FALLBACK
      return NextResponse.json(
        {
          success: false,
          error: "Failed to fetch settings from API Hub",
          details: apiError?.message || "Unknown error",
          status: apiError?.status,
          message: "This endpoint requires API Hub access. Database fallback is not available in the visit service.",
        },
        { status: apiError?.status || 500 }
      )
    }
  } catch (error) {
    console.error("❌ [API] Error fetching settings:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch settings",
        details: error instanceof Error ? error.message : "Unknown error",
        message: "This endpoint requires API Hub access. Database fallback is not available in the visit service.",
      },
      { status: 500 },
    )
  }
}

// PUT - Update a setting
export async function PUT(request: NextRequest) {
  // ENFORCE: Visit service MUST use API client - no direct DB access
  throwIfDirectDbNotAllowed("settings PUT endpoint")
  
  try {
    const auth = getClerkUserIdFromRequest(request)
    if (!auth.clerkUserId && !auth.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { key, value, description } = body

    if (!key) {
      return NextResponse.json({ error: "Setting key is required" }, { status: 400 })
    }

    try {
      const modifiedBy = auth.email || auth.clerkUserId || "system"
      const result = await radiusApiClient.updateSetting(key, value, description, modifiedBy)

      return NextResponse.json({
        success: true,
        message: result.message || "Setting updated successfully",
      })
    } catch (apiError: any) {
      console.error(`❌ [API] Error updating setting via API Hub:`, apiError)
      console.error(`❌ [API] API error details:`, {
        message: apiError?.message,
        status: apiError?.status,
        statusText: apiError?.statusText,
        response: apiError?.response,
        stack: apiError?.stack,
      })
      
      // Return detailed error - NO DATABASE FALLBACK
      return NextResponse.json(
        {
          success: false,
          error: "Failed to update setting via API Hub",
          details: apiError?.message || "Unknown error",
          status: apiError?.status,
          message: "This endpoint requires API Hub access. Database fallback is not available in the visit service.",
        },
        { status: apiError?.status || 500 }
      )
    }
  } catch (error) {
    console.error("❌ [API] Error updating setting:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update setting",
        details: error instanceof Error ? error.message : "Unknown error",
        message: "This endpoint requires API Hub access. Database fallback is not available in the visit service.",
      },
      { status: 500 },
    )
  }
}

