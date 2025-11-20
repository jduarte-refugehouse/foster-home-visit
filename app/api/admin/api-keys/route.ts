import { NextRequest, NextResponse } from "next/server"
import {
  createApiKey,
  revokeApiKey,
  getApiKeysForMicroservice,
  getAllActiveApiKeys,
} from "@/lib/api-auth"
import { requireClerkAuth } from "@refugehouse/shared-core/auth"
import { checkPermission } from "@refugehouse/shared-core/permissions"
import { MICROSERVICE_CONFIG } from "@/lib/microservice-config"
import { query } from "@refugehouse/shared-core/db"

export const dynamic = "force-dynamic"
const CURRENT_MICROSERVICE = MICROSERVICE_CONFIG.code

/**
 * GET /api/admin/api-keys
 * Get all API keys (optionally filtered by microservice)
 */
export async function GET(request: NextRequest) {
  try {
    // Require authentication (for admin dashboard)
    let auth
    try {
      auth = requireClerkAuth(request)
    } catch (authError) {
      console.error("❌ [API-KEYS] Auth error:", authError)
      return NextResponse.json(
        {
          error: "Unauthorized",
          details: authError instanceof Error ? authError.message : "Missing authentication headers",
        },
        { status: 401 }
      )
    }

    if (!auth.clerkUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check permissions - system_admin can view API keys
    try {
      const permissionCheck = await checkPermission(["system_admin"], CURRENT_MICROSERVICE, request)
      if (!permissionCheck.authorized) {
        console.log(`⚠️ [API-KEYS] Permission check failed: ${permissionCheck.reason}`)
        return NextResponse.json(
          { error: "Insufficient permissions", reason: permissionCheck.reason },
          { status: 403 }
        )
      }
    } catch (permError) {
      console.error("❌ [API-KEYS] Permission check error:", permError)
      return NextResponse.json(
        {
          error: "Permission check failed",
          details: permError instanceof Error ? permError.message : "Unknown error",
        },
        { status: 500 }
      )
    }

    const { searchParams } = new URL(request.url)
    const microserviceCode = searchParams.get("microserviceCode")

    let keys
    try {
      if (microserviceCode) {
        keys = await getApiKeysForMicroservice(microserviceCode)
      } else {
        keys = await getAllActiveApiKeys()
      }
    } catch (dbError: any) {
      // Handle case where api_keys table doesn't exist yet
      if (dbError.message?.includes("Invalid object name") || dbError.message?.includes("api_keys")) {
        console.warn("⚠️ [API-KEYS] api_keys table not found - returning empty array")
        return NextResponse.json({
          success: true,
          keys: [],
          count: 0,
          message: "API keys table not found. Please run the database migration script.",
        })
      }
      throw dbError
    }

    // Don't return the full hash, just the prefix for display
    const safeKeys = keys.map((key) => ({
      id: key.id,
      microservice_code: key.microservice_code,
      api_key_prefix: key.api_key_prefix,
      api_key: `${key.api_key_prefix}...`, // Show prefix only for display
      api_key_display: `${key.api_key_prefix}...`, // Also include for frontend compatibility
      created_at: key.created_at,
      created_by_user_id: key.created_by_user_id,
      expires_at: key.expires_at,
      is_active: key.is_active,
      rate_limit_per_minute: key.rate_limit_per_minute,
      last_used_at: key.last_used_at,
      usage_count: key.usage_count,
      description: key.description,
    }))

    return NextResponse.json({
      success: true,
      keys: safeKeys,
      apiKeys: safeKeys, // Also include for compatibility
      count: safeKeys.length,
    })
  } catch (error) {
    console.error("❌ [API-KEYS] Error fetching API keys:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/api-keys
 * Create a new API key
 */
export async function POST(request: NextRequest) {
  try {
    // Require authentication
    let auth
    try {
      auth = requireClerkAuth(request)
    } catch (authError) {
      console.error("❌ [API-KEYS] Auth error:", authError)
      return NextResponse.json(
        {
          error: "Unauthorized",
          details: authError instanceof Error ? authError.message : "Missing authentication headers",
        },
        { status: 401 }
      )
    }

    if (!auth.clerkUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check permissions - system_admin can manage API keys
    try {
      const permissionCheck = await checkPermission(["system_admin"], CURRENT_MICROSERVICE, request)
      if (!permissionCheck.authorized) {
        console.log(`⚠️ [API-KEYS] Permission check failed: ${permissionCheck.reason}`)
        return NextResponse.json(
          { error: "Insufficient permissions", reason: permissionCheck.reason },
          { status: 403 }
        )
      }
    } catch (permError) {
      console.error("❌ [API-KEYS] Permission check error:", permError)
      return NextResponse.json(
        {
          error: "Permission check failed",
          details: permError instanceof Error ? permError.message : "Unknown error",
        },
        { status: 500 }
      )
    }

    const body = await request.json()
    const {
      microserviceCode,
      expiresAt,
      rateLimitPerMinute,
      description,
    } = body

    if (!microserviceCode) {
      return NextResponse.json(
        { error: "microserviceCode is required" },
        { status: 400 }
      )
    }

    // Get user ID from database
    const users = await query(
      "SELECT id FROM app_users WHERE clerk_user_id = @param0",
      [auth.clerkUserId]
    )

    if (users.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const userId = users[0].id

    // Create API key
    let apiKeyResult
    try {
      apiKeyResult = await createApiKey(microserviceCode, userId, {
        expiresAt: expiresAt ? new Date(expiresAt) : undefined,
        rateLimitPerMinute: rateLimitPerMinute || 100,
        description: description || null,
      })
    } catch (dbError: any) {
      // Handle case where api_keys table doesn't exist yet
      if (dbError.message?.includes("Invalid object name") || dbError.message?.includes("api_keys")) {
        console.warn("⚠️ [API-KEYS] api_keys table not found")
        return NextResponse.json(
          {
            success: false,
            error: "API keys table not found. Please run the database migration script.",
          },
          { status: 500 }
        )
      }
      throw dbError
    }

    const { apiKey, keyRecord } = apiKeyResult

    // Return the plain text key (only shown once!)
    return NextResponse.json({
      success: true,
      apiKey, // Plain text key - show this to user
      key: {
        id: keyRecord.id,
        microservice_code: keyRecord.microservice_code,
        api_key_prefix: keyRecord.api_key_prefix,
        api_key: `${keyRecord.api_key_prefix}...`, // Don't return full key after creation
        created_at: keyRecord.created_at,
        created_by_user_id: keyRecord.created_by_user_id,
        expires_at: keyRecord.expires_at,
        is_active: keyRecord.is_active,
        rate_limit_per_minute: keyRecord.rate_limit_per_minute,
        last_used_at: keyRecord.last_used_at,
        usage_count: keyRecord.usage_count,
        description: keyRecord.description,
      },
      message: "API key created successfully. Save this key securely - it will not be shown again!",
    })
  } catch (error) {
    console.error("❌ [API-KEYS] Error creating API key:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/admin/api-keys
 * Revoke an API key
 */
export async function DELETE(request: NextRequest) {
  try {
    // Require authentication
    let auth
    try {
      auth = requireClerkAuth(request)
    } catch (authError) {
      console.error("❌ [API-KEYS] Auth error:", authError)
      return NextResponse.json(
        {
          error: "Unauthorized",
          details: authError instanceof Error ? authError.message : "Missing authentication headers",
        },
        { status: 401 }
      )
    }

    if (!auth.clerkUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check permissions - system_admin can manage API keys
    try {
      const permissionCheck = await checkPermission(["system_admin"], CURRENT_MICROSERVICE, request)
      if (!permissionCheck.authorized) {
        console.log(`⚠️ [API-KEYS] Permission check failed: ${permissionCheck.reason}`)
        return NextResponse.json(
          { error: "Insufficient permissions", reason: permissionCheck.reason },
          { status: 403 }
        )
      }
    } catch (permError) {
      console.error("❌ [API-KEYS] Permission check error:", permError)
      return NextResponse.json(
        {
          error: "Permission check failed",
          details: permError instanceof Error ? permError.message : "Unknown error",
        },
        { status: 500 }
      )
    }

    const { searchParams } = new URL(request.url)
    const keyId = searchParams.get("keyId")

    if (!keyId) {
      return NextResponse.json(
        { error: "keyId is required" },
        { status: 400 }
      )
    }

    try {
      await revokeApiKey(keyId)
    } catch (dbError: any) {
      // Handle case where api_keys table doesn't exist yet
      if (dbError.message?.includes("Invalid object name") || dbError.message?.includes("api_keys")) {
        console.warn("⚠️ [API-KEYS] api_keys table not found")
        return NextResponse.json(
          {
            success: false,
            error: "API keys table not found. Please run the database migration script.",
          },
          { status: 500 }
        )
      }
      throw dbError
    }

    return NextResponse.json({
      success: true,
      message: "API key revoked successfully",
    })
  } catch (error) {
    console.error("❌ [API-KEYS] Error revoking API key:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}

