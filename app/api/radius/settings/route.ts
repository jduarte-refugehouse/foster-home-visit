import { NextRequest, NextResponse } from "next/server"
import { validateApiKey } from "@/lib/api-auth"
import { query } from "@refugehouse/shared-core/db"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

/**
 * GET /api/radius/settings
 * 
 * Proxy endpoint for accessing system settings from RadiusBifrost
 * Requires API key authentication via x-api-key header
 * 
 * Query Parameters:
 * - key: Specific setting key to retrieve (optional, if not provided returns all settings)
 * 
 * Returns: { success: boolean, setting?: Setting, settings?: Setting[] }
 */
export async function GET(request: NextRequest) {
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

    console.log(
      `✅ [RADIUS-API] Authenticated request from microservice: ${validation.key?.microservice_code}`
    )

    // 2. Parse query parameters
    const { searchParams } = new URL(request.url)
    const key = searchParams.get("key")

    // 3. Query RadiusBifrost directly
    if (key) {
      // Get specific setting
      const result = await query(
        `SELECT ConfigKey, ConfigValue, Description, ModifiedDate, ModifiedBy 
         FROM SystemConfig 
         WHERE ConfigKey = @param0`,
        [key],
      )

      if (result.length === 0) {
        return NextResponse.json(
          {
            success: false,
            error: "Setting not found",
          },
          { status: 404 }
        )
      }

      const duration = Date.now() - startTime
      console.log(`✅ [RADIUS-API] Retrieved setting '${key}' in ${duration}ms`)

      return NextResponse.json({
        success: true,
        setting: result[0],
        timestamp: new Date().toISOString(),
        duration_ms: duration,
      })
    } else {
      // Get all settings
      const result = await query(
        `SELECT ConfigKey, ConfigValue, Description, ModifiedDate, ModifiedBy 
         FROM SystemConfig 
         ORDER BY ConfigKey`,
        [],
      )

      const duration = Date.now() - startTime
      console.log(`✅ [RADIUS-API] Retrieved ${result.length} settings in ${duration}ms`)

      return NextResponse.json({
        success: true,
        settings: result,
        timestamp: new Date().toISOString(),
        duration_ms: duration,
      })
    }
  } catch (error) {
    const duration = Date.now() - startTime
    console.error("❌ [RADIUS-API] Error in settings GET:", error)

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
 * PUT /api/radius/settings
 * 
 * Update a system setting in RadiusBifrost
 * Requires API key authentication via x-api-key header
 */
export async function PUT(request: NextRequest) {
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

    // 2. Parse request body
    const body = await request.json()
    const { key, value, description, modifiedBy } = body

    if (!key) {
      return NextResponse.json(
        {
          success: false,
          error: "Setting key is required",
        },
        { status: 400 }
      )
    }

    // 3. Check if setting exists
    const existing = await query(
      `SELECT ConfigKey FROM SystemConfig WHERE ConfigKey = @param0`,
      [key],
    )

    const modifiedByValue = modifiedBy || validation.key?.microservice_code || "system"

    if (existing.length === 0) {
      // Insert new setting
      await query(
        `INSERT INTO SystemConfig (ConfigKey, ConfigValue, Description, ModifiedDate, ModifiedBy)
         VALUES (@param0, @param1, @param2, GETUTCDATE(), @param3)`,
        [key, value || null, description || null, modifiedByValue],
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
        [key, value || null, description || null, modifiedByValue],
      )
    }

    const duration = Date.now() - startTime
    console.log(`✅ [RADIUS-API] Updated setting '${key}' in ${duration}ms`)

    return NextResponse.json({
      success: true,
      message: "Setting updated successfully",
      timestamp: new Date().toISOString(),
      duration_ms: duration,
    })
  } catch (error) {
    const duration = Date.now() - startTime
    console.error("❌ [RADIUS-API] Error in settings PUT:", error)

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

