import { NextRequest, NextResponse } from "next/server"
import { currentUser } from "@clerk/nextjs/server"
import { radiusApiClient } from "@refugehouse/radius-api-client"

export const dynamic = "force-dynamic"

/**
 * POST /api/admin/test-radius-api
 * 
 * Proxy endpoint for testing Radius API Hub endpoints
 * Uses server-side API key authentication
 */
export async function POST(request: NextRequest) {
  try {
    // Require authentication (for admin dashboard) - use Clerk's server-side currentUser
    const clerkUser = await currentUser()
    if (!clerkUser) {
      return NextResponse.json({ error: "Unauthorized - please sign in" }, { status: 401 })
    }

    const body = await request.json()
    const { endpoint, method, params, requestBody } = body

    if (!endpoint) {
      return NextResponse.json({ error: "endpoint is required" }, { status: 400 })
    }

    console.log(`🧪 [TEST-API] Testing endpoint: ${endpoint}`, { method, params, requestBody })

    let result: any

    // Route to appropriate client method
    switch (endpoint) {
      case "auth/user-lookup": {
        if (method !== "GET") {
          return NextResponse.json({ error: "Method must be GET" }, { status: 400 })
        }
        result = await radiusApiClient.lookupUser({
          clerkUserId: params?.clerkUserId,
          email: params?.email,
          microserviceCode: params?.microserviceCode,
        })
        break
      }

      case "auth/user-create": {
        if (method !== "POST") {
          return NextResponse.json({ error: "Method must be POST" }, { status: 400 })
        }
        result = await radiusApiClient.createUser({
          clerkUserId: requestBody?.clerkUserId,
          email: requestBody?.email,
          firstName: requestBody?.firstName,
          lastName: requestBody?.lastName,
          phone: requestBody?.phone,
          microserviceCode: requestBody?.microserviceCode,
        })
        break
      }

      case "permissions": {
        if (method !== "GET") {
          return NextResponse.json({ error: "Method must be GET" }, { status: 400 })
        }
        if (!params?.userId) {
          return NextResponse.json({ error: "userId is required" }, { status: 400 })
        }
        result = await radiusApiClient.getPermissions({
          userId: params.userId,
          microserviceCode: params?.microserviceCode,
        })
        break
      }

      case "navigation": {
        if (method !== "GET") {
          return NextResponse.json({ error: "Method must be GET" }, { status: 400 })
        }
        result = await radiusApiClient.getNavigation({
          userId: params?.userId,
          microserviceCode: params?.microserviceCode,
          userPermissions: params?.userPermissions,
        })
        break
      }

      default:
        return NextResponse.json({ error: `Unknown endpoint: ${endpoint}` }, { status: 400 })
    }

    console.log(`✅ [TEST-API] Endpoint ${endpoint} returned successfully`)

    return NextResponse.json({
      success: true,
      endpoint,
      result,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error(`❌ [TEST-API] Error testing endpoint:`, error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    const errorStack = error instanceof Error ? error.stack : undefined

    // Extract response data from the error if available
    const responseData = (error as any)?.responseData || {}
    const responseStatus = (error as any)?.status || null

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        stack: errorStack,
        apiHubErrorResponse: responseStatus ? { status: responseStatus, data: responseData } : undefined,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}

