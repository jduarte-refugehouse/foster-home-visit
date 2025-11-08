import { NextResponse, type NextRequest } from "next/server"

export const dynamic = "force-dynamic"

// Allowed origin patterns for placement history API
const ALLOWED_ORIGINS = [
  /^https?:\/\/.*\.vercel\.app$/,
  /^https?:\/\/.*\.refugehouse\.org$/,
  /^https?:\/\/.*\.refugehouse\.app$/,
]

/**
 * NOTE: This function is no longer used for incoming requests.
 * The API key is only used when making outbound calls to the external Pulse app API.
 * Incoming requests to our endpoint are protected by origin checking only.
 */

/**
 * Check if the request origin is allowed
 * Checks both Origin and Referer headers for better coverage
 */
function isOriginAllowed(request: NextRequest): boolean {
  const origin = request.headers.get("origin")
  const referer = request.headers.get("referer")
  
  // Check Origin header first (most reliable for CORS requests)
  if (origin) {
    const originAllowed = ALLOWED_ORIGINS.some(pattern => pattern.test(origin))
    if (originAllowed) {
      return true
    }
  }
  
  // Fallback to Referer header (for same-origin requests)
  if (referer) {
    try {
      const refererUrl = new URL(referer)
      const refererOrigin = `${refererUrl.protocol}//${refererUrl.host}`
      const refererAllowed = ALLOWED_ORIGINS.some(pattern => pattern.test(refererOrigin))
      if (refererAllowed) {
        return true
      }
    } catch (e) {
      // Invalid referer URL, ignore
    }
  }
  
  // If no origin/referer headers, deny (could be a direct API call)
  return false
}

export async function GET(request: NextRequest) {
  try {
    // Security check: Verify request origin (primary protection)
    // Note: API key is NOT checked here - it's only used when calling the external Pulse app API
    if (!isOriginAllowed(request)) {
      const origin = request.headers.get("origin") || "none"
      const referer = request.headers.get("referer") || "none"
      console.warn(`🚫 [API] Unauthorized origin attempt - Origin: ${origin}, Referer: ${referer}`)
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized: Request must come from an allowed origin",
        },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const homeGUID = searchParams.get("homeGUID")
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")

    if (!homeGUID) {
      return NextResponse.json(
        { success: false, error: "homeGUID parameter is required" },
        { status: 400 }
      )
    }

    if (!startDate || !endDate) {
      return NextResponse.json(
        { success: false, error: "Both startDate and endDate are required" },
        { status: 400 }
      )
    }

    // Get the base URL from environment variable
    const pulseBaseUrl = process.env.PULSE_ENVIRONMENT_URL
    
    if (!pulseBaseUrl) {
      console.error("❌ [API] PULSE_ENVIRONMENT_URL not configured")
      return NextResponse.json(
        { success: false, error: "Placement history service not configured" },
        { status: 500 }
      )
    }

    console.log(`📋 [API] Fetching placement history from ${pulseBaseUrl} for home: ${homeGUID} from ${startDate} to ${endDate}`)

    // Call the external placement history API
    const apiUrl = `${pulseBaseUrl}/api/placement-history`
    const fullUrl = `${apiUrl}?homeGUID=${encodeURIComponent(homeGUID)}&startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`
    console.log(`📋 [API] Calling external API: ${fullUrl}`)
    
    const response = await fetch(fullUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.PULSE_APP_API_KEY || '',
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`❌ [API] Placement history API error: ${response.status}`)
      console.error(`❌ [API] External API URL: ${fullUrl}`)
      console.error(`❌ [API] Error response: ${errorText}`)
      return NextResponse.json(
        {
          success: false,
          error: `External API returned ${response.status}. Check if PULSE_ENVIRONMENT_URL is correct and the endpoint exists.`,
          details: errorText || `External API at ${apiUrl} returned status ${response.status}`,
          externalUrl: apiUrl,
        },
        { status: response.status }
      )
    }

    const result = await response.json()
    return NextResponse.json(result)

  } catch (error: any) {
    console.error("❌ [API] Error fetching placement history:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch placement history",
        details: error.message,
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Security check: Verify request origin (primary protection)
    // Note: API key is NOT checked here - it's only used when calling the external Pulse app API
    if (!isOriginAllowed(request)) {
      const origin = request.headers.get("origin") || "none"
      const referer = request.headers.get("referer") || "none"
      console.warn(`🚫 [API] Unauthorized origin attempt - Origin: ${origin}, Referer: ${referer}`)
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized: Request must come from an allowed origin",
        },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { homeGUID, startDate, endDate } = body

    if (!homeGUID) {
      return NextResponse.json(
        { success: false, error: "homeGUID parameter is required" },
        { status: 400 }
      )
    }

    if (!startDate || !endDate) {
      return NextResponse.json(
        { success: false, error: "Both startDate and endDate are required" },
        { status: 400 }
      )
    }

    // Get the base URL from environment variable
    const pulseBaseUrl = process.env.PULSE_ENVIRONMENT_URL
    
    if (!pulseBaseUrl) {
      console.error("❌ [API] PULSE_ENVIRONMENT_URL not configured")
      return NextResponse.json(
        { success: false, error: "Placement history service not configured" },
        { status: 500 }
      )
    }

    console.log(`📋 [API] Fetching placement history from ${pulseBaseUrl} for home: ${homeGUID} from ${startDate} to ${endDate}`)

    // Call the external placement history API
    const apiUrl = `${pulseBaseUrl}/api/placement-history`
    console.log(`📋 [API] Calling external API: ${apiUrl}`)
    
    const response = await fetch(`${apiUrl}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.PULSE_APP_API_KEY || '',
      },
      body: JSON.stringify({
        homeGUID,
        startDate,
        endDate,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`❌ [API] Placement history API error: ${response.status}`)
      console.error(`❌ [API] External API URL: ${apiUrl}`)
      console.error(`❌ [API] Error response: ${errorText}`)
      return NextResponse.json(
        {
          success: false,
          error: `External API returned ${response.status}. Check if PULSE_ENVIRONMENT_URL is correct and the endpoint exists.`,
          details: errorText || `External API at ${apiUrl} returned status ${response.status}`,
          externalUrl: apiUrl,
        },
        { status: response.status }
      )
    }

    const result = await response.json()
    return NextResponse.json(result)

  } catch (error: any) {
    console.error("❌ [API] Error in POST request:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch placement history",
        details: error.message,
      },
      { status: 500 }
    )
  }
}

