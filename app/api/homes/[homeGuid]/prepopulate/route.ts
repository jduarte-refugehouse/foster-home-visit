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
  
  try {
    console.log(`🔍 [API] Fetching prepopulation data via API Hub for home: ${homeGuid}`)
    const data = await radiusApiClient.getHomePrepopulationData(homeGuid)
    console.log(`✅ [API] Prepopulation data received from API Hub`)
    return NextResponse.json(data)
  } catch (apiError: any) {
    console.error(`❌ [API] Error fetching prepopulation data from API Hub:`, apiError)
    console.error(`❌ [API] API error details:`, {
      message: apiError?.message,
      status: apiError?.status,
      statusText: apiError?.statusText,
      response: apiError?.response,
      stack: apiError?.stack,
    })
    
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
        message: "This endpoint requires API Hub access. Database fallback is not available in the visit service.",
      },
      { status: errorStatus }
    )
  }
}
