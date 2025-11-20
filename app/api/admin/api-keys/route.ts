import { NextRequest, NextResponse } from "next/server"
import {
  createApiKey,
  revokeApiKey,
  getApiKeysForMicroservice,
  getAllActiveApiKeys,
} from "@/lib/api-auth"
import { requireClerkAuth } from "@refugehouse/shared-core/auth"
import { query } from "@refugehouse/shared-core/db"

export const dynamic = "force-dynamic"

/**
 * GET /api/admin/api-keys
 * Get all API keys (optionally filtered by microservice)
 */
export async function GET(request: NextRequest) {
  try {
    // Require authentication (for admin dashboard)
    const auth = requireClerkAuth(request)
    if (!auth.clerkUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const microserviceCode = searchParams.get("microserviceCode")

    let keys
    if (microserviceCode) {
      keys = await getApiKeysForMicroservice(microserviceCode)
    } else {
      keys = await getAllActiveApiKeys()
    }

    // Don't return the full hash, just the prefix for display
    const safeKeys = keys.map((key) => ({
      ...key,
      api_key_hash: undefined, // Remove hash from response
      api_key_display: `${key.api_key_prefix}...`, // Show prefix only
    }))

    return NextResponse.json({
      success: true,
      keys: safeKeys,
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
    const auth = requireClerkAuth(request)
    if (!auth.clerkUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
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
    const { apiKey, keyRecord } = await createApiKey(microserviceCode, userId, {
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      rateLimitPerMinute: rateLimitPerMinute || 100,
      description: description || null,
    })

    // Return the plain text key (only shown once!)
    return NextResponse.json({
      success: true,
      apiKey, // Plain text key - show this to user
      key: {
        ...keyRecord,
        api_key_hash: undefined, // Don't return hash
        api_key_display: `${keyRecord.api_key_prefix}...`,
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
    const auth = requireClerkAuth(request)
    if (!auth.clerkUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const keyId = searchParams.get("keyId")

    if (!keyId) {
      return NextResponse.json(
        { error: "keyId is required" },
        { status: 400 }
      )
    }

    await revokeApiKey(keyId)

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

