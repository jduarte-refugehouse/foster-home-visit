import { NextRequest, NextResponse } from "next/server"
import { query } from "@refugehouse/shared-core/db"
import { getClerkUserIdFromRequest } from "@refugehouse/shared-core/auth"
import { shouldUseRadiusApiClient } from "@/lib/microservice-config"
import { radiusApiClient } from "@refugehouse/radius-api-client"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

// GET - Fetch all settings or a specific setting
export async function GET(request: NextRequest) {
  try {
    const useApiClient = shouldUseRadiusApiClient()
    
    if (useApiClient) {
      // Use API client for non-admin microservices (visit service, etc.)
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
        return NextResponse.json(
          {
            success: false,
            error: "Failed to fetch settings from API Hub",
            details: apiError?.message || "Unknown error",
            status: apiError?.status,
          },
          { status: apiError?.status || 500 }
        )
      }
    }

    // Direct DB access for admin microservice
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
      // Use API client for non-admin microservices (visit service, etc.)
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
        return NextResponse.json(
          {
            success: false,
            error: "Failed to update setting via API Hub",
            details: apiError?.message || "Unknown error",
            status: apiError?.status,
          },
          { status: apiError?.status || 500 }
        )
      }
    }

    // Direct DB access for admin microservice
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

