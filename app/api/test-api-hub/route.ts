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
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        message: "API Hub test failed. Check your environment variables and API key.",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}

