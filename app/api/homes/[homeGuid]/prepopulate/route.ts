import { NextResponse } from "next/server"
import { throwIfDirectDbNotAllowed } from "@/lib/microservice-config"
import { radiusApiClient } from "@refugehouse/radius-api-client"

export const dynamic = "force-dynamic"

/**
 * GET /api/homes/[homeGuid]/prepopulate
 * 
 * VISIT SERVICE ENDPOINT - NO DIRECT DATABASE ACCESS
 * 
 * This endpoint fetches prepopulation data via the API Hub.
 * All data access MUST go through the API Hub - no database fallbacks.
 * 
 * If the API Hub call fails, an error is returned with details.
 */
export async function GET(request: Request, { params }: { params: { homeGuid: string } }) {
  const { homeGuid } = params
  
  // ENFORCE: Visit service MUST use API client - no direct DB access
  throwIfDirectDbNotAllowed("homes prepopulate endpoint")
  
  // Log the request details
  const apiHubUrl = process.env.RADIUS_API_HUB_URL || "https://admin.refugehouse.app"
  const apiEndpoint = `${apiHubUrl}/api/radius/homes/${homeGuid}/prepopulate`
  console.log(`🔍 [VISIT-SERVICE] ==========================================`)
  console.log(`🔍 [VISIT-SERVICE] Step 4: Fetch Prepopulation Data`)
  console.log(`🔍 [VISIT-SERVICE] ------------------------------------------`)
  console.log(`🔍 [VISIT-SERVICE] Home GUID: ${homeGuid}`)
  console.log(`🔍 [VISIT-SERVICE] API Hub URL: ${apiHubUrl}`)
  console.log(`🔍 [VISIT-SERVICE] Full Endpoint: ${apiEndpoint}`)
  console.log(`🔍 [VISIT-SERVICE] Method: GET`)
  console.log(`🔍 [VISIT-SERVICE] Headers: x-api-key: [REDACTED]`)
  console.log(`🔍 [VISIT-SERVICE] Calling API Hub now...`)
  
  try {
    const data = await radiusApiClient.getHomePrepopulationData(homeGuid)
    console.log(`✅ [VISIT-SERVICE] Successfully received prepopulation data from API Hub`)
    console.log(`✅ [VISIT-SERVICE] Response keys: ${Object.keys(data).join(", ")}`)
    return NextResponse.json(data)
  } catch (apiError: any) {
    console.error(`❌ [VISIT-SERVICE] ==========================================`)
    console.error(`❌ [VISIT-SERVICE] ERROR: Failed to fetch prepopulation data`)
    console.error(`❌ [VISIT-SERVICE] ------------------------------------------`)
    console.error(`❌ [VISIT-SERVICE] Home GUID: ${homeGuid}`)
    console.error(`❌ [VISIT-SERVICE] API Hub URL: ${apiHubUrl}`)
    console.error(`❌ [VISIT-SERVICE] Full Endpoint: ${apiEndpoint}`)
    console.error(`❌ [VISIT-SERVICE] Error Type: ${apiError?.constructor?.name || typeof apiError}`)
    console.error(`❌ [VISIT-SERVICE] Error Message: ${apiError?.message || "No message"}`)
    console.error(`❌ [VISIT-SERVICE] Error Status: ${apiError?.status || "N/A"}`)
    console.error(`❌ [VISIT-SERVICE] Error StatusText: ${apiError?.statusText || "N/A"}`)
    console.error(`❌ [VISIT-SERVICE] Error Response:`, apiError?.response || "N/A")
    console.error(`❌ [VISIT-SERVICE] Error Stack:`, apiError?.stack || "No stack trace")
    console.error(`❌ [VISIT-SERVICE] Full Error Object:`, JSON.stringify(apiError, Object.getOwnPropertyNames(apiError), 2))
    
    // Return detailed error - NO DATABASE FALLBACK
    const errorMessage = apiError?.message || "Unknown error"
    const errorStatus = apiError?.status || 500
    
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch prepopulation data from API Hub",
        details: errorMessage,
        status: errorStatus,
        homeGuid: homeGuid,
        apiHubUrl: apiHubUrl,
        endpoint: apiEndpoint,
        errorType: apiError?.constructor?.name || typeof apiError,
        message: "This endpoint requires API Hub access. Database fallback is not available in the visit service.",
      },
      { status: errorStatus }
    )
  }
}
