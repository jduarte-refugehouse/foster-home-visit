import { NextRequest, NextResponse } from "next/server"
import { query } from "@refugehouse/shared-core/db"
import { getClerkUserIdFromRequest } from "@refugehouse/shared-core/auth"
import { shouldUseRadiusApiClient, throwIfDirectDbNotAllowed } from "@/lib/microservice-config"
import { radiusApiClient } from "@refugehouse/radius-api-client"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

// GET - Fetch all settings or a specific setting
export async function GET(request: NextRequest) {
  try {
    const useApiClient = shouldUseRadiusApiClient()
    
    if (useApiClient) {
      // Use API client to fetch settings
      const { searchParams } = new URL(request.url)
      const key = searchParams.get("key")

      if (key) {
        // Get specific setting
        const setting = await radiusApiClient.getSetting(key)
        if (!setting) {
          return NextResponse.json({ error: "Setting not found" }, { status: 404 })
        }
        return NextResponse.json({
          success: true,
          setting,
        })
      } else {
        // Get all settings
        const settings = await radiusApiClient.getAllSettings()
        return NextResponse.json({
          success: true,
          settings,
        })
      }
    }

    const { searchParams } = new URL(request.url)
    const key = searchParams.get("key")

    if (key) {
      // Get specific setting
      const result = await query(
        `SELECT ConfigKey, ConfigValue, Description, ModifiedDate, ModifiedBy 
         FROM SystemConfig 
         WHERE ConfigKey = @param0`,
        [key],
      )

      if (result.length === 0) {
        return NextResponse.json({ error: "Setting not found" }, { status: 404 })
      }

      return NextResponse.json({
        success: true,
        setting: result[0],
      })
    } else {
      // Direct DB access for admin microservice
      throwIfDirectDbNotAllowed("settings GET endpoint")
      // Get all settings
      const result = await query(
        `SELECT ConfigKey, ConfigValue, Description, ModifiedDate, ModifiedBy 
         FROM SystemConfig 
         ORDER BY ConfigKey`,
        [],
      )

      return NextResponse.json({
        success: true,
        settings: result,
      })
    }
  } catch (error) {
    console.error("❌ [API] Error fetching settings:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch settings",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

// PUT - Update a setting
export async function PUT(request: NextRequest) {
  try {
    const useApiClient = shouldUseRadiusApiClient()
    
    if (useApiClient) {
      // Use API client to update setting
      const auth = getClerkUserIdFromRequest(request)
      if (!auth.clerkUserId && !auth.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }

      const body = await request.json()
      const { key, value, description } = body

      if (!key) {
        return NextResponse.json({ error: "Setting key is required" }, { status: 400 })
      }

      const modifiedBy = auth.email || auth.clerkUserId || "system"
      const result = await radiusApiClient.updateSetting(key, value, description, modifiedBy)

      return NextResponse.json({
        success: true,
        message: result.message || "Setting updated successfully",
      })
    }

    const auth = getClerkUserIdFromRequest(request)
    if (!auth.clerkUserId && !auth.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { key, value, description } = body

    if (!key) {
      return NextResponse.json({ error: "Setting key is required" }, { status: 400 })
    }

    // Check if setting exists
    const existing = await query(
      `SELECT ConfigKey FROM SystemConfig WHERE ConfigKey = @param0`,
      [key],
    )

    const modifiedBy = auth.email || auth.clerkUserId || "system"

    if (existing.length === 0) {
      // Insert new setting
      await query(
        `INSERT INTO SystemConfig (ConfigKey, ConfigValue, Description, ModifiedDate, ModifiedBy)
         VALUES (@param0, @param1, @param2, GETUTCDATE(), @param3)`,
        [key, value || null, description || null, modifiedBy],
      )
    } else {
      // Update existing setting
      await query(
        `UPDATE SystemConfig 
         SET ConfigValue = @param1,
             Description = @param2,
             ModifiedDate = GETUTCDATE(),
             ModifiedBy = @param3
         WHERE ConfigKey = @param0`,
        [key, value || null, description || null, modifiedBy],
      )
    }

    return NextResponse.json({
      success: true,
      message: "Setting updated successfully",
    })
  } catch (error) {
    console.error("❌ [API] Error updating setting:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update setting",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

