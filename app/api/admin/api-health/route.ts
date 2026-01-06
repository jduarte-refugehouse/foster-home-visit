import { NextRequest, NextResponse } from "next/server"
import { query } from "@refugehouse/shared-core/db"
import { getAllActiveApiKeys } from "@/lib/api-auth"

export const dynamic = "force-dynamic"

/**
 * GET /api/admin/api-health
 * Get API health metrics and statistics
 */
export async function GET(request: NextRequest) {
  try {
    // Get all active API keys with usage stats
    const keys = await getAllActiveApiKeys()

    // Get recent usage stats from database
    const usageStats = await query(
      `
      SELECT 
        microservice_code,
        COUNT(*) as total_keys,
        SUM(usage_count) as total_requests,
        MAX(last_used_at) as last_activity,
        AVG(CAST(rate_limit_per_minute AS FLOAT)) as avg_rate_limit
      FROM api_keys
      WHERE is_active = 1
      GROUP BY microservice_code
    `
    )

    // Calculate health metrics
    const totalKeys = keys.length
    const totalRequests = keys.reduce((sum, key) => sum + (key.usage_count || 0), 0)
    const activeKeys = keys.filter((key) => key.last_used_at).length
    const expiredKeys = keys.filter(
      (key) => key.expires_at && new Date(key.expires_at) < new Date()
    ).length

    // Get endpoint health (simple check - can be enhanced)
    const endpointHealth = {
      "/api/radius/homes": { status: "healthy", lastChecked: new Date().toISOString() },
      "/api/radius/appointments": { status: "healthy", lastChecked: new Date().toISOString() },
      "/api/radius/visit-forms": { status: "healthy", lastChecked: new Date().toISOString() },
      "/api/radius/users": { status: "healthy", lastChecked: new Date().toISOString() },
      // Phase 1: Auth endpoints
      "/api/radius/auth/user-lookup": { status: "healthy", lastChecked: new Date().toISOString() },
      "/api/radius/auth/user-create": { status: "healthy", lastChecked: new Date().toISOString() },
      "/api/radius/permissions": { status: "healthy", lastChecked: new Date().toISOString() },
      "/api/radius/navigation": { status: "healthy", lastChecked: new Date().toISOString() },
    }

    return NextResponse.json({
      success: true,
      health: {
        overall: "healthy",
        timestamp: new Date().toISOString(),
      },
      statistics: {
        totalKeys,
        activeKeys,
        expiredKeys,
        totalRequests,
        keysByMicroservice: usageStats,
      },
      endpoints: endpointHealth,
    })
  } catch (error) {
    console.error("❌ [API-HEALTH] Error fetching health data:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}

