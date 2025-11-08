import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  try {
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
    const response = await fetch(`${apiUrl}?homeGUID=${encodeURIComponent(homeGUID)}&startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`❌ [API] Placement history API error: ${response.status} - ${errorText}`)
      return NextResponse.json(
        {
          success: false,
          error: "Failed to fetch placement history from external service",
          details: errorText,
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

export async function POST(request: Request) {
  try {
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
    const response = await fetch(`${apiUrl}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        homeGUID,
        startDate,
        endDate,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`❌ [API] Placement history API error: ${response.status} - ${errorText}`)
      return NextResponse.json(
        {
          success: false,
          error: "Failed to fetch placement history from external service",
          details: errorText,
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

