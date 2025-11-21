import { NextRequest, NextResponse } from "next/server"
import { requireClerkAuth } from "@refugehouse/shared-core/auth"
import { checkPermission } from "@refugehouse/shared-core/permissions"
import { MICROSERVICE_CONFIG } from "@/lib/microservice-config"
import { query } from "@refugehouse/shared-core/db"
import { hashApiKey } from "@/lib/api-auth"

export const dynamic = "force-dynamic"
const CURRENT_MICROSERVICE = MICROSERVICE_CONFIG.code

/**
 * POST /api/admin/api-keys/validate
 * 
 * Diagnostic endpoint to validate an API key (admin only)
 * This helps debug why API keys might not be working
 */
export async function POST(request: NextRequest) {
  try {
    // Require authentication
    let auth
    try {
      auth = requireClerkAuth(request)
    } catch (authError) {
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

    // Check permissions - system_admin can validate API keys
    try {
      const permissionCheck = await checkPermission(["system_admin"], CURRENT_MICROSERVICE, request)
      if (!permissionCheck.authorized) {
        return NextResponse.json(
          { error: "Insufficient permissions", reason: permissionCheck.reason },
          { status: 403 }
        )
      }
    } catch (permError) {
      return NextResponse.json(
        {
          error: "Permission check failed",
          details: permError instanceof Error ? permError.message : "Unknown error",
        },
        { status: 500 }
      )
    }

    const body = await request.json()
    const { apiKey } = body

    if (!apiKey) {
      const hashed = hashApiKey(apiKey)
      const prefix = apiKey.substring(0, 12)

      // Check by hash
      const keysByHash = await query(
        `SELECT 
          id, microservice_code, api_key_hash, api_key_prefix,
          created_at, created_by_user_id, expires_at, is_active,
          rate_limit_per_minute, last_used_at, usage_count, description
        FROM api_keys 
        WHERE api_key_hash = @param0`,
        [hashed]
      )

      // Check by prefix
      const keysByPrefix = await query(
        `SELECT 
          id, microservice_code, api_key_hash, api_key_prefix,
          created_at, created_by_user_id, expires_at, is_active,
          rate_limit_per_minute, last_used_at, usage_count, description
        FROM api_keys 
        WHERE api_key_prefix = @param0`,
        [prefix]
      )

      return NextResponse.json({
        success: true,
        validation: {
          providedKey: {
            prefix: prefix,
            hash: hashed,
            length: apiKey.length,
          },
          foundByHash: keysByHash.length > 0,
          foundByPrefix: keysByPrefix.length > 0,
          keysByHash: keysByHash.map((k: any) => ({
            id: k.id,
            microservice_code: k.microservice_code,
            is_active: k.is_active,
            expires_at: k.expires_at,
            created_at: k.created_at,
          })),
          keysByPrefix: keysByPrefix.map((k: any) => ({
            id: k.id,
            microservice_code: k.microservice_code,
            is_active: k.is_active,
            expires_at: k.expires_at,
            created_at: k.created_at,
            hashMatches: k.api_key_hash === hashed,
          })),
        },
      })
    } else {
      // List all API keys (just metadata, not the actual keys)
      const allKeys = await query(
        `SELECT 
          id, microservice_code, api_key_prefix,
          created_at, created_by_user_id, expires_at, is_active,
          rate_limit_per_minute, last_used_at, usage_count, description
        FROM api_keys 
        ORDER BY created_at DESC`
      )

      return NextResponse.json({
        success: true,
        allKeys: allKeys.map((k: any) => ({
          id: k.id,
          microservice_code: k.microservice_code,
          api_key_prefix: k.api_key_prefix,
          is_active: k.is_active,
          expires_at: k.expires_at,
          created_at: k.created_at,
          last_used_at: k.last_used_at,
          usage_count: k.usage_count,
          description: k.description,
        })),
      })
    }
  } catch (error) {
    console.error("❌ [API-KEYS-VALIDATE] Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}

