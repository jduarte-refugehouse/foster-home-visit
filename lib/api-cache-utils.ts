import { NextResponse } from "next/server"

/**
 * Utility functions for preventing caching in API responses
 * 
 * Modern web infrastructure has multiple caching layers:
 * - Browser cache
 * - CDN/Edge cache (Vercel)
 * - Next.js fetch cache
 * - API client cache
 * 
 * This utility ensures all layers are disabled for dynamic data.
 */

/**
 * Add comprehensive cache-busting headers to a NextResponse
 * Use this for endpoints that return frequently-changing data
 */
export function addNoCacheHeaders(response: NextResponse): NextResponse {
  // Standard HTTP cache control (multiple directives for compatibility)
  response.headers.set(
    'Cache-Control',
    'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0, s-maxage=0'
  )
  
  // Legacy HTTP/1.0 cache control
  response.headers.set('Pragma', 'no-cache')
  response.headers.set('Expires', '0')
  
  // Platform-specific cache control
  response.headers.set('X-Vercel-Cache-Control', 'no-store') // Vercel edge cache
  response.headers.set('CDN-Cache-Control', 'no-store') // Generic CDN cache
  
  return response
}

/**
 * Next.js route configuration for dynamic endpoints
 * Add these exports to your route file:
 * 
 * export const dynamic = "force-dynamic"
 * export const revalidate = 0
 * export const fetchCache = "force-no-store"
 */
export const DYNAMIC_ROUTE_CONFIG = {
  dynamic: "force-dynamic" as const,
  revalidate: 0,
  fetchCache: "force-no-store" as const,
}

