import { query } from "@refugehouse/shared-core/db"
import crypto from "crypto"

export interface ApiKey {
  id: string
  microservice_code: string
  api_key_hash: string
  api_key_prefix: string
  created_at: Date
  created_by_user_id: string | null
  expires_at: Date | null
  is_active: boolean
  rate_limit_per_minute: number
  last_used_at: Date | null
  usage_count: number
  description: string | null
}

/**
 * Hash an API key using SHA-256
 * This is a one-way hash for secure storage
 */
export function hashApiKey(apiKey: string): string {
  return crypto.createHash("sha256").update(apiKey).digest("hex")
}

/**
 * Generate a secure random API key
 * Format: rh_<32 random hex chars>
 * Example: rh_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
 */
export function generateApiKey(): string {
  const randomBytes = crypto.randomBytes(16).toString("hex")
  return `rh_${randomBytes}`
}

/**
 * Validate an API key by checking it against the database
 * Also updates last_used_at and usage_count
 */
export async function validateApiKey(apiKey: string | null): Promise<{
  valid: boolean
  key?: ApiKey
  error?: string
}> {
  if (!apiKey) {
    console.warn("🚫 [API-AUTH] No API key provided")
    return { valid: false, error: "API key is required" }
  }

  try {
    // Trim whitespace from API key (common issue with environment variables)
    const trimmedKey = apiKey.trim()
    if (trimmedKey !== apiKey) {
      console.log(`⚠️ [API-AUTH] API key had whitespace - trimmed from ${apiKey.length} to ${trimmedKey.length} chars`)
    }
    
    // Hash the provided key
    const hashed = hashApiKey(trimmedKey)
    const keyPrefix = trimmedKey.substring(0, 12)
    console.log(`🔍 [API-AUTH] Validating API key with prefix: ${keyPrefix}...`)

    // Look up the key in the database
    const keys = await query<ApiKey>(
      `SELECT 
        id, microservice_code, api_key_hash, api_key_prefix,
        created_at, created_by_user_id, expires_at, is_active,
        rate_limit_per_minute, last_used_at, usage_count, description
      FROM api_keys 
      WHERE api_key_hash = @param0 AND is_active = 1`,
      [hashed]
    )

    console.log(`🔍 [API-AUTH] Database lookup result: ${keys.length} key(s) found`)

    if (keys.length === 0) {
      // Try to find by prefix to see if key exists but hash doesn't match
      const keysByPrefix = await query<ApiKey>(
        `SELECT 
          id, microservice_code, api_key_hash, api_key_prefix,
          created_at, created_by_user_id, expires_at, is_active,
          rate_limit_per_minute, last_used_at, usage_count, description
        FROM api_keys 
        WHERE api_key_prefix = @param0`,
        [keyPrefix]
      )
      
      if (keysByPrefix.length > 0) {
        console.error(`❌ [API-AUTH] Key prefix matches but hash doesn't! Prefix: ${keyPrefix}, Found keys: ${keysByPrefix.length}`)
        return { valid: false, error: "Invalid API key (hash mismatch)" }
      }
      
      console.warn(`🚫 [API-AUTH] No API key found with hash or prefix: ${keyPrefix}`)
      return { valid: false, error: "Invalid API key" }
    }

    const key = keys[0]

    // Check if key has expired
    if (key.expires_at && new Date(key.expires_at) < new Date()) {
      return { valid: false, error: "API key has expired" }
    }

    // Update last_used_at and usage_count
    await query(
      `UPDATE api_keys 
       SET last_used_at = GETDATE(), 
           usage_count = usage_count + 1
       WHERE id = @param0`,
      [key.id]
    )

    return { valid: true, key }
  } catch (error) {
    console.error("❌ [API-AUTH] Error validating API key:", error)
    return {
      valid: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

/**
 * Create a new API key for a microservice
 */
export async function createApiKey(
  microserviceCode: string,
  createdByUserId?: string,
  options?: {
    expiresAt?: Date
    rateLimitPerMinute?: number
    description?: string
  }
): Promise<{ apiKey: string; keyRecord: ApiKey }> {
  // Generate new API key
  const apiKey = generateApiKey()
  const hashed = hashApiKey(apiKey)
  const prefix = apiKey.substring(0, 12) // First 12 chars for display

  // Insert into database
  const result = await query<{ id: string }>(
    `INSERT INTO api_keys (
      microservice_code, api_key_hash, api_key_prefix,
      created_by_user_id, expires_at, rate_limit_per_minute, description
    )
    OUTPUT INSERTED.id
    VALUES (
      @param0, @param1, @param2, @param3, @param4, @param5, @param6
    )`,
    [
      microserviceCode,
      hashed,
      prefix,
      createdByUserId || null,
      options?.expiresAt || null,
      options?.rateLimitPerMinute || 100,
      options?.description || null,
    ]
  )

  if (result.length === 0) {
    throw new Error("Failed to create API key")
  }

  // Fetch the created key record
  const keys = await query<ApiKey>(
    `SELECT 
      id, microservice_code, api_key_hash, api_key_prefix,
      created_at, created_by_user_id, expires_at, is_active,
      rate_limit_per_minute, last_used_at, usage_count, description
    FROM api_keys 
    WHERE id = @param0`,
    [result[0].id]
  )

  return {
    apiKey, // Return the plain text key (only shown once!)
    keyRecord: keys[0],
  }
}

/**
 * Revoke an API key (set is_active = 0)
 */
export async function revokeApiKey(keyId: string): Promise<void> {
  await query(
    `UPDATE api_keys 
     SET is_active = 0 
     WHERE id = @param0`,
    [keyId]
  )
}

/**
 * Get all API keys for a microservice
 */
export async function getApiKeysForMicroservice(
  microserviceCode: string
): Promise<ApiKey[]> {
  return await query<ApiKey>(
    `SELECT 
      id, microservice_code, api_key_hash, api_key_prefix,
      created_at, created_by_user_id, expires_at, is_active,
      rate_limit_per_minute, last_used_at, usage_count, description
    FROM api_keys 
    WHERE microservice_code = @param0
    ORDER BY created_at DESC`,
    [microserviceCode]
  )
}

/**
 * Get all active API keys
 */
export async function getAllActiveApiKeys(): Promise<ApiKey[]> {
  return await query<ApiKey>(
    `SELECT 
      id, microservice_code, api_key_hash, api_key_prefix,
      created_at, created_by_user_id, expires_at, is_active,
      rate_limit_per_minute, last_used_at, usage_count, description
    FROM api_keys 
    WHERE is_active = 1
    ORDER BY microservice_code, created_at DESC`
  )
}

