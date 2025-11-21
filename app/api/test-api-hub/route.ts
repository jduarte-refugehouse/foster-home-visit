import { NextResponse } from "next/server"
import { radiusApiClient } from "@refugehouse/radius-api-client"

export const dynamic = "force-dynamic"

/**
 * Test endpoint to verify API Hub connectivity
 * GET /api/test-api-hub
 */
export async function GET() {
  try {
    console.log("🧪 [TEST] Testing API Hub connectivity...")
    console.log("🧪 [TEST] Environment check:", {
      hasApiKey: !!process.env.RADIUS_API_KEY,
      apiHubUrl: process.env.RADIUS_API_HUB_URL || "https://admin.refugehouse.app (default)",
      apiKeyPrefix: process.env.RADIUS_API_KEY?.substring(0, 8) || "NOT SET",
    })

    // Test 1: Fetch homes
    console.log("🧪 [TEST] Fetching homes from API Hub...")
    const homes = await radiusApiClient.getHomes()
    console.log(`✅ [TEST] Retrieved ${homes.length} homes from API Hub`)

    // Test 2: Fetch appointments (last 30 days)
    console.log("🧪 [TEST] Fetching appointments from API Hub...")
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const appointments = await radiusApiClient.getAppointments({
      startDate: thirtyDaysAgo.toISOString().split("T")[0],
    })
    console.log(`✅ [TEST] Retrieved ${appointments.length} appointments from API Hub`)

    return NextResponse.json({
      success: true,
      message: "API Hub is working correctly!",
      results: {
        homes: {
          count: homes.length,
          sample: homes.slice(0, 3).map((h) => ({
            id: h.id,
            name: h.name,
            address: h.address,
          })),
        },
        appointments: {
          count: appointments.length,
          sample: appointments.slice(0, 3).map((a) => ({
            appointment_id: a.appointment_id,
            title: a.title,
            start_datetime: a.start_datetime,
          })),
        },
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("❌ [TEST] API Hub test failed:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    const errorStack = error instanceof Error ? error.stack : undefined
    
    const rawApiKey = process.env.RADIUS_API_KEY
    const trimmedApiKey = rawApiKey?.trim()
    const hasApiKey = !!rawApiKey
    const apiKeyPrefix = hasApiKey ? trimmedApiKey?.substring(0, 12) : "N/A"
    const apiHubUrl = process.env.RADIUS_API_HUB_URL || "https://admin.refugehouse.app (default)"
    const hadWhitespace = rawApiKey && rawApiKey !== trimmedApiKey
    
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        stack: errorStack,
        message: "API Hub test failed. Check your environment variables and API key.",
        environment: {
          hasApiKey,
          apiHubUrl,
          apiKeyPrefix,
          apiKeyLength: trimmedApiKey?.length,
          rawApiKeyLength: rawApiKey?.length,
          hadWhitespace,
        },
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}

